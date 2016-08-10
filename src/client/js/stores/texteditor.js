/**
 * Created by michbil on 07.08.16.
 */
import Reflux from 'reflux';
import TextActions from '../actions/texteditor.js';
import {CompositeDecorator, ContentState, SelectionState, Editor, EditorState, Entity, RichUtils, CharacterMetadata, getDefaultKeyBinding,  Modifier} from 'draft-js';
import LinkEntity from '../components/LinkEntity.js';

// helper function
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


export default Reflux.createStore({
    listenables:TextActions,

    createLinkEntity(title,url,desc) {
        return Entity.create('LINK', 'MUTABLE', {
            linkTitle: title,
            linkUrl: url,
            linkDesc: desc,
            editCallback: this.openEditPrompt.bind(this)
        });
    },

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
    },

    createEditorState(contentBlocks, mentions) {
        const decorator = new CompositeDecorator([{
            strategy: findLinkEntities,
            component: LinkEntity
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
    },
    onCreateNewLink(titleValue,urlValue,descValue) {

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
    },
    onCancelLink(e) {
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
    },
    onRemoveLink(e) {
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


});