import React from 'react';
import {CompositeDecorator, ContentState, SelectionState, Editor, EditorState, Entity, RichUtils, CharacterMetadata} from 'draft-js';
import CustomActions from './customActions';
import CommentEnabler from './CommentEnabler.js';

class CoreEditor extends React.Component {
    constructor(props) {
        super(props);

        const decorator = new CompositeDecorator([{
            strategy: findLinkEntities,
            component: Link
        }]);

        let {
            contentBlocks, mentions
        } = props;
        let editorState = contentBlocks.length > 0 ? EditorState.createWithContent(ContentState.createFromBlockArray(contentBlocks), decorator) : EditorState.createEmpty(decorator);


        this.handleKeyCommand = (command) => this._handleKeyCommand(command);
        this.toggleBlockType = (type) => this._toggleBlockType(type);
        this.toggleInlineStyle = (style) => this._toggleInlineStyle(style);
        this.toggleCustomAction = (action) => this._toggleCustomAction(action);

        this.promptForLink = () => this._promptForLink();
        this.promptForEdit = (urlValue, linkEntityKey) => this._promptForEdit(urlValue, linkEntityKey);
        this.onURLChange = (e) => this.setState({
            urlValue: e.target.value
        });

        mentions.forEach((mention, i) => {
            const entityKey = Entity.create('LINK', 'MUTABLE', {
                url: mention.url,
                onLinkEdit: this.promptForEdit.bind(this)
            });

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

        this.state = {
            editorState: editorState,
            showURLInput: false,
            isEditLink: false,
            linkEntityKey: 0,
            urlValue: '',
            saveRelativePath: props.saveRelativePath,
            editUrl: props.editUrl,
            author: props.author,
            commentID: this.props.commentID
        };
        this.focus = () => this.refs.editor.focus();
        this.onChange = (editorState) => {
            this.setState({
                editorState
            });
        };

        this.confirmLink = this._confirmLink.bind(this);
        this.editLink = this._editLink.bind(this);
        this.cancelLink = this._cancelLink.bind(this);
        this.removeLink = this._removeLink.bind(this);
        this.onLinkInputKeyDown = this._onLinkInputKeyDown.bind(this);
    }

    _promptForLink() {
        const {
            editorState
        } = this.state;
        const selection = editorState.getSelection();
        if (!selection.isCollapsed()) {
            this.setState({
                showURLInput: 1,
                urlValue: ''
            });
        }
    }

    _promptForEdit(urlValue, linkEntityKey) {
        const {
            editorState
        } = this.state;
        this.setState({
            showURLInput: 1,
            isEditLink: 1,
            urlValue,
            linkEntityKey
        });
    }

    _editLink(e) {
        e.preventDefault();
        const {
            urlValue, linkEntityKey
        } = this.state;

        Entity.mergeData(linkEntityKey, {
            url: urlValue
        });

        this.setState({
            showURLInput: 0,
            isEditLink: 0,
            linkEntityKey: 0,
            urlValue: '',
        }, () => {
            setTimeout(() => this.refs.editor.focus(), 0);
        });
    }

    _cancelLink(e) {
        e.preventDefault();

        this.setState({
            showURLInput: 0,
            isEditLink: 0,
            linkEntityKey: 0,
            urlValue: '',
        }, () => {
            setTimeout(() => this.refs.editor.focus(), 0);
        });
    }

    _removeLink(e) {
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
            isEditLink: 0,
            linkEntityKey: 0,
            urlValue: '',
        }, () => {
            setTimeout(() => this.refs.editor.focus(), 0);
        });
    }

    _confirmLink(e) {
        e.preventDefault();
        const {
            editorState, urlValue
        } = this.state;
        const entityKey = Entity.create('LINK', 'MUTABLE', {
            url: urlValue,
            onLinkEdit: this.promptForEdit
        });
        let _editorState = RichUtils.toggleLink(
            editorState,
            editorState.getSelection(),
            entityKey
        );
        this.setState({
            editorState: _editorState,
            showURLInput: false,
            urlValue: '',
        }, () => {
            setTimeout(() => this.refs.editor.focus(), 0);
        });
    }

    _onLinkInputKeyDown(e) {
        if (e.which === 13) {
            this.state.isEditLink ? this._editLink(e) : this._confirmLink(e);
        }
    }

    _handleKeyCommand(command) {
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

    _toggleBlockType(blockType) {
        this.onChange(
            RichUtils.toggleBlockType(
                this.state.editorState,
                blockType
            )
        );
    }

    _toggleInlineStyle(inlineStyle) {
        this.onChange(
            RichUtils.toggleInlineStyle(
                this.state.editorState,
                inlineStyle
            )
        );
    }

    _toggleCustomAction(action) {
        // this is the place where to pass arguments to custom actions
        CustomActions.toggleCustomAction(this.state.editorState, action, this.state.saveRelativePath, this.state.author,this.state.commentID);
    }

    gotCommentID (id) {
        this.setState({
            commentID:id
        });
    }

    componentDidUpdate () {
        window.frameReady();
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
                  <CustomActionControls
                    editorState={editorState}
                    onToggle={this.toggleCustomAction}
                  />
                  {this.state.showURLInput ? <LinkUrlControls isEditLink={this.state.isEditLink}  urlValue={this.state.urlValue} onCancelLink={this.cancelLink} onRemoveLink={this.removeLink} onEditLink={this.editLink} onConfirmLink={this.confirmLink} onLinkInputKeyDown={this.onLinkInputKeyDown} onURLChange={this.onURLChange}  /> : !!0}
                  <div className={className} onClick={this.focus}>
                    <Editor
                      blockStyleFn={getBlockStyle}
                      editorState={editorState}
                      handleKeyCommand={this.handleKeyCommand}
                      onChange={this.onChange}
                      placeholder="Enter text..."
                      ref="editor"
                      spellCheck={true}
                    />
                  </div>
                </div>
                <CommentEnabler commentID={this.state.commentID} author={this.props.author} editUrl={this.state.editUrl} gotCommentID={this.gotCommentID.bind(this)}/>
            </div>
        );
    }
}

CoreEditor.propTypes = {
    contentBlocks: React.PropTypes.array,
    mentions: React.PropTypes.array,
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
        this.onToggle = (e) => {
            e.preventDefault();
            this.props.onToggle(this.props.style);
        };
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

class LinkUrlControls extends React.Component {
    constructor(props) {
        super(props);
        this.onEditLink = (e) => {
            e.preventDefault();
            this.props.onEditLink(e);
        };
        this.onConfirmLink = (e) => {
            e.preventDefault();
            this.props.onConfirmLink(e);
        };
        this.onURLChange = (e) => {
            this.props.onURLChange(e);
        };
        this.onLinkInputKeyDown = (e) => {
            this.props.onLinkInputKeyDown(e);
        };
        this.onCancelLink = (e) => {
            e.preventDefault();
            this.props.onCancelLink(e);
        };
        this.onRemoveLink = (e) => {
            e.preventDefault();
            this.props.onRemoveLink(e);
        };
    }

    render() {
        return (
            <div style={styles.urlInputContainer}>
                <input
                  onChange={this.onURLChange}
                  ref="url"
                  style={styles.urlInput}
                  type="text"
                  value={this.props.urlValue}
                  onKeyDown={this.onLinkInputKeyDown}
                />
                <button onMouseDown={this.props.isEditLink ? this.onEditLink : this.onConfirmLink}>
                    Confirm
                </button>
                <button onMouseDown={this.onCancelLink}>
                    Cancel
                </button>
                {this.props.isEditLink ? (<button onMouseDown={this.onRemoveLink}>
                    Remove
                </button>) : null}
            </div>
        );
    }
};

LinkUrlControls.propTypes = {
    onEditLink: React.PropTypes.func,
    onConfirmLink: React.PropTypes.func,
    onURLChange: React.PropTypes.func,
    onLinkInputKeyDown: React.PropTypes.func,
    onCancelLink: React.PropTypes.func,
    onRemoveLink: React.PropTypes.func,
    isEditLink: React.PropTypes.bool,
    urlValue: React.PropTypes.string
};

const BLOCK_TYPES = [{
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
}];

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

var INLINE_STYLES = [{
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
}, ];

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
        this.onToggle = (e) => {
            e.preventDefault();
            this.props.onToggle(this.props.action);
        };
    }

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

var CUSTOM_ACTIONS = [{
    label: 'Save',
    action: 'save'
}, {
    label: 'Save As',
    action: 'saveas'
}];

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

        const {
            url, onLinkEdit
        } = Entity.get(props.entityKey).getData();


        this.url = url;

        this.onLinkEdit = (e) => {
            e.preventDefault();
            onLinkEdit(this.url, props.entityKey);
        };

    }

    componentWillReceiveProps(props) {
        const {
            url, onLinkEdit
        } = Entity.get(props.entityKey).getData();
        this.url = url;
        this.onLinkEdit = (e) => {
            e.preventDefault();
            onLinkEdit(this.url, props.entityKey);
        };
    }

    render() {
        return (
            <a href={this.url} onClick={this.onLinkEdit}>
                {this.props.children}
            </a>
        );
    }
};

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
    urlInputContainer: {
        marginBottom: 10,
    },
    urlInput: {
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

/*class CoreEditor extends React.Component {
    constructor(props) {
        super(props);

        const decorator = new CompositeDecorator([{
            strategy: findLinkEntities,
            component: Link,
        }, ]);

        this.state = {
            editorState: EditorState.createEmpty(decorator),
            showURLInput: false,
            urlValue: '',
        };

        this.focus = () => this.refs.editor.focus();
        this.onChange = (editorState) => this.setState({
            editorState
        });
        this.logState = () => {
            const content = this.state.editorState.getCurrentContent();
            console.log(convertToRaw(content));
        };

        this.promptForLink = this._promptForLink.bind(this);
        this.onURLChange = (e) => this.setState({
            urlValue: e.target.value
        });
        this.confirmLink = this._confirmLink.bind(this);
        this.onLinkInputKeyDown = this._onLinkInputKeyDown.bind(this);
        this.removeLink = this._removeLink.bind(this);
    }


    render() {
        let urlInput;
        if (this.state.showURLInput) {
            urlInput =
                <div style={styles.urlInputContainer}>
                <input
                  onChange={this.onURLChange}
                  ref="url"
                  style={styles.urlInput}
                  type="text"
                  value={this.state.urlValue}
                  onKeyDown={this.onLinkInputKeyDown}
                />
                <button onMouseDown={this.confirmLink}>
                  Confirm
                </button>
              </div>;
        }

        return (
            <div style={styles.root}>
              <div style={{marginBottom: 10}}>
                Select some text, then use the buttons to add or remove links
                on the selected text.
              </div>
              <div style={styles.buttons}>
                <button
                  onMouseDown={this.promptForLink}
                  style={{marginRight: 10}}>
                  Add Link
                </button>
                <button onMouseDown={this.removeLink}>
                  Remove Link
                </button>
              </div>
              {urlInput}
              <div style={styles.editor} onClick={this.focus}>
                <Editor
                  editorState={this.state.editorState}
                  onChange={this.onChange}
                  placeholder="Enter some text..."
                  ref="editor"
                />
              </div>
              <input
                onClick={this.logState}
                style={styles.button}
                type="button"
                value="Log State"
              />
            </div>
        );
    }
}
*/

export default CoreEditor;
