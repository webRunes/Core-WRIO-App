import React from 'react';
import {CompositeDecorator, ContentState, SelectionState, Editor, EditorState, Entity, RichUtils, CharacterMetadata, getDefaultKeyBinding,  Modifier} from 'draft-js';
import CustomActions from './customActions';
import CommentEnabler from './CommentEnabler.js';

import LinkUrlDialog from './LinkUrlDialog.js';

class CoreEditor extends React.Component {
    constructor(props) {
        super(props);
        var contentBlocks,mentions;
        var doc = this.props.doc;
        if (doc) {
            doc.toDraft();
            contentBlocks = doc.contentBlocks;
            mentions = doc.mentions;
        } else {
            contentBlocks = [];
            mentions = [];
        }
        this.state = {
            editorState: this.createEditorState(contentBlocks,mentions),
            showURLInput: false,
            isEditLink: false,
            linkEntityKey: 0,
            titleValue: '',
            urlValue: '',
            descValue: '',
            saveRelativePath: props.saveRelativePath,
            editUrl: props.editUrl,
            author: props.author,
            commentID: this.props.commentID,
            doc:doc
        };
        this.handleKeyCommand   = this.handleKeyCommand.bind(this);
        this.toggleBlockType    = this.toggleBlockType.bind(this);
        this.toggleInlineStyle  = this.toggleInlineStyle.bind(this);
        this.toggleCustomAction = this.toggleCustomAction.bind(this);
        this.promptForLink      = this.promptForLink.bind(this);
        this.openEditPrompt      = this.openEditPrompt.bind(this);
        this.focus              = this.focus.bind(this);
        this.onChange           = this.onChange.bind(this);
        this.createNewLink      = this.createNewLink.bind(this);
        this.editLink           = this.editLink.bind(this);
        this.cancelLink         = this.cancelLink.bind(this);
        this.removeLink         = this.removeLink.bind(this);
    }
    onChange(editorState) {
        this.setState({
            editorState
        });
    }
    focus() {
        this.refs.editor.focus();
    }
    createLinkEntity(title,url,desc) {
        return Entity.create('LINK', 'MUTABLE', {
            linkTitle: title,
            linkUrl: url,
            linkDesc: desc,
            editCallback: this.openEditPrompt.bind(this)
        });
    }
    createEditorState(contentBlocks, mentions) {
        const decorator = new CompositeDecorator([{
            strategy: findLinkEntities,
            component: Link
        }]);
        let editorState = contentBlocks.length > 0 ? EditorState.createWithContent(ContentState.createFromBlockArray(contentBlocks), decorator) : EditorState.createEmpty(decorator);
        mentions.forEach((mention, i) => {
            const entityKey = this.createLinkEntity(mention.linkTitle,mention.linkUrl,mention.linkDesc);
            const key = contentBlocks[mention.block].getKey();
            editorState = RichUtils.toggleLink(
                editorState,
                SelectionState.createEmpty(key).merge({
                    anchorOffset: mention.start,
                    focusKey: key,
                    focusOffset: mention.end
                }),
                entityKey
            );
        }); 
        return editorState;
    }
    promptForLink() {

        var title = this.getSelectedText();

        this.setState({
            showURLInput: 1,
            titleValue: title
        });

        console.log(this.state.titleValue);
            
    }
    getSelectedText() {
        const {
            editorState
        } = this.state;
        var title = '';
        const selectionState = editorState.getSelection();
        const blockKey = selectionState.getAnchorKey();
        const contentBlocks = editorState.getCurrentContent().getBlocksAsArray();
        var start = selectionState.getStartOffset();
        var end = selectionState.getEndOffset();

         contentBlocks.forEach((block) => {
                if(block.key === blockKey){
                    title = block.text.slice(start, end);
                }
            });
         return title;
    }
    openEditPrompt(titleValue, urlValue, descValue, linkEntityKey) {
        const {
            editorState
        } = this.state;
        this.setState({
            showURLInput: 1,
            isEditLink: true,
            titleValue,
            urlValue,
            descValue,
            linkEntityKey
        });
    }
    editLink(titleValue,urlValue,descValue) {

        const {linkEntityKey} = this.state;
        Entity.mergeData(entityKey, {
            linkTitle: titleValue,
            linkUrl: urlValue,
            linkDesc: descValue
        });
        this.setState({
            showURLInput: 0,
            isEditLink: false,
            linkEntityKey: linkEntityKey,
            titleValue: '',
            urlValue: '',
            descValue: ''
        }, () => {
            setTimeout(() => this.refs.editor.focus(), 0);
        });
    }

    createNewLink(titleValue,urlValue,descValue) {

        const entityKey = this.createLinkEntity(titleValue,urlValue,descValue);
        const {editorState} = this.state;

        let _editorState = RichUtils.toggleLink(
            editorState,
            editorState.getSelection(),
            entityKey
        );
        this.setState({
            editorState: _editorState,
            showURLInput: false,
        }, () => {
            setTimeout(() => this.refs.editor.focus(), 0);
        });
    }


    cancelLink(e) {
        e.preventDefault();
        this.setState({
            showURLInput: 0,
            isEditLink: false,
            linkEntityKey: 0,
            titleValue: '',
            urlValue: '',
            descValue: ''
        }, () => {
            setTimeout(() => this.refs.editor.focus(), 0);
        });
    }
    removeLink(e) {
        e.preventDefault();
        const {
            linkEntityKey,
            editorState
        } = this.state;
        let _editorState;
        editorState.getCurrentContent().getBlockMap().map(block => {
            block.findEntityRanges(char => {
                let entityKey = char.getEntity();
                return !!entityKey && entityKey === linkEntityKey && Entity.get(entityKey).getType() === 'LINK';
            }, (anchorOffset, focusOffset) => {
                _editorState = RichUtils.toggleLink(
                    editorState,
                    SelectionState.createEmpty(block.getKey()).merge({
                        anchorOffset,
                        focusKey: block.getKey(),
                        focusOffset
                    }),
                    null
                );
            });
        });
        this.setState({
            editorState: _editorState || editorState,
            showURLInput: 0,
            isEditLink: false,
            linkEntityKey: 0,
            titleValue: '',
            urlValue: '',
            descValue: ''
        }, () => {
            setTimeout(() => this.refs.editor.focus(), 0);
        });
    }
    handleKeyCommand(command) {
        const {
            editorState
        } = this.state;
        const newState = RichUtils.handleKeyCommand(editorState, command);
        if (newState) {
            this.onChange(newState);
            return true;
        }
        return false;
    }
    toggleBlockType(blockType) {
        this.onChange(
            RichUtils.toggleBlockType(
                this.state.editorState,
                blockType
            )
        );
    }
    toggleInlineStyle(inlineStyle) {
        this.onChange(
            RichUtils.toggleInlineStyle(
                this.state.editorState,
                inlineStyle
            )
        );
    }
    toggleCustomAction(action) {
        // this is the place where to pass arguments to custom actions
        CustomActions.toggleCustomAction(this.state.editorState, action, this.state.saveRelativePath, this.state.author,this.state.commentID,this.state.doc);
    }
    gotCommentID (id) {
        this.setState({
            commentID:id
        });
    }
    componentDidUpdate () {
        window.frameReady();
    }
    myKeyBindingFn(e) {
      if (e.keyCode === 13) {
        window.frameReady();
      }
      return getDefaultKeyBinding(e);
    }
    render() {
        const {
            editorState
        } = this.state;
        // If the user changes block type before entering any text, we can
        // either style the placeholder or hide it. Let's just hide it now.
        let className = 'RichEditor-editor';
        var contentState = editorState.getCurrentContent();
        if (!contentState.hasText()) {
            if (contentState.getBlockMap().first().getType() !== 'unstyled') {
                className += ' RichEditor-hidePlaceholder';
            }
        }
        
        return (
            <div>
                <div className="RichEditor-root">
                  <BlockStyleControls
                    editorState={editorState}
                    onToggle={this.toggleBlockType}
                    onLinkToggle={this.promptForLink}
                  />
                  <InlineStyleControls
                    editorState={editorState}
                    onToggle={this.toggleInlineStyle}
                  />
                  { !this.state.showURLInput ? null : 
                  
                  
                    <LinkUrlDialog
                        isEditLink={this.state.isEditLink} 
                        onCancelLink={this.cancelLink} 
                        onRemoveLink={this.removeLink} 
                        onEditLink={this.editLink} 
                        promptForEdit={this.openEditPrompt}
                        onConfirmLink={this.createNewLink}
                        titleValue={this.state.titleValue}
                        descValue={this.state.descValue}
                        urlValue={this.state.urlValue}
                        />
                   }
                  <div className={className} onClick={this.focus}>
                    <Editor
                      blockStyleFn={getBlockStyle}
                      editorState={editorState}
                      handleKeyCommand={this.handleKeyCommand}
                      onChange={this.onChange}
                      placeholder="Enter text..."
                      ref="editor"
                      spellCheck={true}
                      keyBindingFn={this.myKeyBindingFn}
                    />
                  </div>
                </div>
                <CommentEnabler commentID={this.state.commentID} author={this.props.author} editUrl={this.state.editUrl} gotCommentID={this.gotCommentID.bind(this)}/>
                <button type="button" className="btn btn-default btn-sm" onClick={() => this._toggleCustomAction('saveas')}>
                    Save
                </button>
                <button type="button" className="btn btn-default btn-sm" onClick={() => this._toggleCustomAction('save')}>
                    Save as
                </button>
            </div>
        );
    }
}

CoreEditor.propTypes = {
    doc: React.PropTypes.object,
    saveRelativePath: React.PropTypes.string,
    editUrl: React.PropTypes.string,
    author: React.PropTypes.string,
    commentID: React.PropTypes.string
};

function getBlockStyle(block) {
    switch (block.getType()) {
        case 'blockquote':
            return 'RichEditor-blockquote';
        default:
            return null;
    }
}

class StyleButton extends React.Component {
    constructor() {
        super();
        this.onToggle = this.onToggle.bind(this);
    }
    onToggle(e) {
        e.preventDefault();
        this.props.onToggle(this.props.style);
    }
    render() {
        let className = 'RichEditor-styleButton';
        if (this.props.active) {
            className += ' RichEditor-activeButton';
        }
        return (
            <span className={className} onMouseDown={this.onToggle}>
              {this.props.label}
            </span>
        );
    }
}

StyleButton.propTypes = {
    onToggle: React.PropTypes.func,
    style: React.PropTypes.string,
    active: React.PropTypes.bool,
    label: React.PropTypes.string
};


const BLOCK_TYPES = [
    {
        label: 'Header',
        style: 'header-two'
    }, {
        label: 'Blockquote',
        style: 'blockquote'
    }, {
        label: 'UL',
        style: 'unordered-list-item'
    }, {
        label: 'OL',
        style: 'ordered-list-item'
    }, {
        label: 'Link',
        style: 'link'
    }
];

const BlockStyleControls = (props) => {
    const {
        editorState
    } = props;
    const selection = editorState.getSelection();
    const blockType = editorState
        .getCurrentContent()
        .getBlockForKey(selection.getStartKey())
        .getType();
    return (
        <div className="RichEditor-controls">
            {BLOCK_TYPES.map((type) => {
                if (type.style === 'link') {
                    return (<StyleButton
                        key={type.label}
                        active={type.style === blockType}
                        label={type.label}
                        onToggle={props.onLinkToggle}
                        style={type.style}
                    />);
                } else {
                    return (<StyleButton
                        key={type.label}
                        active={type.style === blockType}
                        label={type.label}
                        onToggle={props.onToggle}
                        style={type.style}
                    />);
                }
            })}
          </div>
    );
};

BlockStyleControls.propTypes = {
    editorState: React.PropTypes.object,
    onToggle: React.PropTypes.func,
    onLinkToggle: React.PropTypes.func
};

var INLINE_STYLES = [
    {
        label: 'Bold',
        style: 'BOLD'
    }, {
        label: 'Italic',
        style: 'ITALIC'
    }, {
        label: 'Underline',
        style: 'UNDERLINE'
    }, {
        label: 'Monospace',
        style: 'CODE'
    }
];

const InlineStyleControls = (props) => {
    let {
        editorState
    } = props;
    var currentStyle = editorState.getCurrentInlineStyle();
    return (
        <div className="RichEditor-controls">
            {INLINE_STYLES.map(type =>
              <StyleButton
                key={type.label}
                active={currentStyle.has(type.style)}
                label={type.label}
                onToggle={props.onToggle}
                style={type.style}
              />
            )}
          </div>
    );
};

InlineStyleControls.propTypes = {
    editorState: React.PropTypes.object,
    onToggle: React.PropTypes.func
};

class ActionButton extends React.Component {
    constructor() {
        super();
        this.onToggle = this.onToggle.bind(this);
    }
    onToggle(e) {
        e.preventDefault();
        this.props.onToggle(this.props.action);
    };
    render() {
        let className = 'RichEditor-styleButton';
        return (
            <span className={className} onMouseDown={this.onToggle}>
              {this.props.label}
            </span>
        );
    }
}

ActionButton.propTypes = {
    onToggle: React.PropTypes.func,
    label: React.PropTypes.string,
    action: React.PropTypes.string
};

var CUSTOM_ACTIONS = [
    {
        label: 'Save',
        action: 'save'
    }, {
        label: 'Save As',
        action: 'saveas'
    }
];

const CustomActionControls = (props) => {
    return (
        <div className="RichEditor-controls">
            {CUSTOM_ACTIONS.map(type =>
              <ActionButton
                key={type.label}
                label={type.label}
                onToggle={props.onToggle}
                action={type.action}
              />
            )}
          </div>
    );
};

CustomActionControls.propTypes = {
    onToggle: React.PropTypes.func
};

function findLinkEntities(contentBlock, callback) {
    contentBlock.findEntityRanges(
        (character) => {
            const entityKey = character.getEntity();
            return (
                !!entityKey &&
                Entity.get(entityKey).getType() === 'LINK'
            );
        },
        callback
    );
}


class Link extends React.Component {
    constructor(props) {
        super(props);
        this.getProps(props);
    }

    getProps(props) {
        const {
            linkTitle, linkUrl, linkDesc, editCallback
            } = Entity.get(props.entityKey).getData();
        console.log(Entity.get(props.entityKey).getData());
        this.linkTitle = linkTitle;
        this.linkUrl = linkUrl;
        this.linkDesc = linkDesc;
        this.entityKey = props.entityKey;
        this.linkCallback = editCallback;
    }

    onLinkEdit (e) {
        e.preventDefault();
        this.linkCallback(this.linkTitle, this.linkUrl, this.linkDesc, this.entityKey);
    }

    componentWillReceiveProps(props) {
        this.getProps(props);
    }
    render() {
        return (
            <a href={this.linkUrl} onClick={this.onLinkEdit.bind(this)}>
                {this.linkTitle}
            </a>
        );
    }
}

Link.propTypes = {
    entityKey: React.PropTypes.string,
    children: React.PropTypes.array
};

const styles = {
    root: {
        fontFamily: '\'Georgia\', serif',
        padding: 20,
        width: 600,
    },
    buttons: {
        marginBottom: 10,
    },
    linkTitleInputContainer: {
        marginBottom: 10,
    },
    linkTitleInput: {
        fontFamily: '\'Georgia\', serif',
        marginRight: 10,
        padding: 3,
    },
    editor: {
        border: '1px solid #ccc',
        cursor: 'text',
        minHeight: 80,
        padding: 10,
    },
    button: {
        marginTop: 10,
        textAlign: 'center',
    }
};


export default CoreEditor;