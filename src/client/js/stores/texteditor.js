/**
 * Created by michbil on 07.08.16.
 */
import Reflux from 'reflux';
import TextActions from '../actions/texteditor.js';
import {AtomicBlockUtils, CompositeDecorator, ContentState, SelectionState, Editor, EditorState, Entity, RichUtils, CharacterMetadata, getDefaultKeyBinding,  Modifier} from 'draft-js';
import LinkEntity from '../EditorEntities/LinkEntity.js';
import ImageEntity from '../EditorEntities/ImageEntitiy.js';
import SocialMediaEntity from '../EditorEntities/SocialMediaEntity.js';
import JSONDocument from '../JSONDocument.js';
import WrioActions from '../actions/wrio.js';
import {getImageObject} from '../JSONDocument.js';

// helper function
const findEntitiesOfType = (type) => (contentBlock, callback) => {
    contentBlock.findEntityRanges(
        (character) => {
            const entityKey = character.getEntity();
            return (
                !!entityKey &&
                Entity.get(entityKey).getType() === type
            );
        },
        callback
    );
};

const findLinkEntities   = findEntitiesOfType('LINK');
const findImageEntities  = findEntitiesOfType('IMAGE');
const findSocialEntities = findEntitiesOfType('SOCIAL');
const isImageLink = (filename) => (/\.(gif|jpg|jpeg|tiff|png)$/i).test(filename);


function appendHttp(url) {
    if (!/^https?:\/\//i.test(url)) {
        return 'http://' + url;
    }
    return url;
}


export default Reflux.createStore({
    listenables:TextActions,

    init() {
        this.state = {
            editorState: EditorState.createEmpty()
        };
        this.oldHeader = "";
    },

    setLinkEditCallback(cb) {
        this.state.linkEditCallback = cb;
    },
    setImageEditCallback(cb) {
        this.state.imageEditCallback = cb;
    },

    createLinkEntity(title,url,desc) {
        return Entity.create('LINK', 'MUTABLE', {
            linkTitle: title,
            linkUrl: url,
            linkDesc: desc,
            editCallback: this.state.linkEditCallback
        });
    },

    getSelectedText() {
        const { editorState } = this.state;
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

    onUpdateEditorState(state) {
        this.state.editorState = state;
        const header = JSONDocument.getTitle(state.getCurrentContent());
        if (header != this.oldHeader) {
            WrioActions.headerChanged(header);
        }
        this.oldHeader = header;
    },

    onPublishEditorState(state) {
        this.state.editorState = state;
        this.trigger(this.state);
        console.log("reaction",state);
    },

    createEditorState(metaBlocks, mentions, images) {
        const decorator = new CompositeDecorator([{
            strategy: findLinkEntities,
            component: LinkEntity
        },{
            strategy: findImageEntities,
            component: ImageEntity
        },
        {
            strategy: findSocialEntities,
            component: SocialMediaEntity
        }
        ]);

        const valuesToKeys = (hash,value)=>{
            let key = value['order']+1;
            hash[key] = value['block'];
            return hash;
        };
        const orderedBlocks = metaBlocks.reduce(valuesToKeys,{});

        console.log(orderedBlocks);
        const contentBlocks = metaBlocks.map(x => x.block);

        let editorState = contentBlocks.length > 0 ?
            EditorState.createWithContent(ContentState.createFromBlockArray(contentBlocks), decorator) :
            EditorState.createEmpty(decorator);

        editorState = metaBlocks.reduce((editorState,metaBlock) => metaBlock.data ? this.constructSocial(editorState,metaBlock) : editorState, editorState);
        if (images) {
            editorState = images.reduce((editorState,mention) => this.constructImage(editorState,orderedBlocks,mention),editorState);
        }

        return mentions.reduce((editorState,mention) => this.constructMention(editorState,orderedBlocks,mention),editorState);

    },

    constructSocial(editorState,metaBlock) {
        const contentBlock = metaBlock.block;
        const blockData = metaBlock.data;
        let entityKey;
        if (blockData["@type"] == "ImageObject") {
            entityKey = this._createImageSocialEntity(blockData.contentUrl,blockData.name,blockData.description);
        } else {
            entityKey = this._createImageSocialEntity(blockData.sharedContent.url,blockData.sharedContent.headline,block.sharedContent.about);
        }
        const key = contentBlock.getKey();
        const _editorState = EditorState.forceSelection(editorState,SelectionState.createEmpty(key));
        return this._insertEntityKey(_editorState,entityKey);

    },

    _getMentionContentBlock(contentBlocks,mention) {
        const block = contentBlocks[mention.block];
        if (!block) {
            console.warn("Cannot create mention",mention);
            return editorState;
        }
        return block;
    },

    constructEntity(entityKey,editorState,contentBlocks,mention) {

        const key = this._getMentionContentBlockKey().getKey();
        try {
            return RichUtils.toggleLink(
                editorState,
                SelectionState.createEmpty(key).merge({
                    anchorOffset: mention.start,
                    focusKey: key,
                    focusOffset: mention.end
                }),
                entityKey
            );
        } catch (e){
            console.error("Error mapping a mention",e);
            return editorState;
        }
    },

    constructMention(editorState, contentBlocks,mention) {
        const entityKey = this.createLinkEntity(mention.linkWord,mention.url,mention.linkDesc);
        return this.constructEntity(entityKey,editorState,contentBlocks,mention);
    },

    constructImage(editorState, contentBlocks,mention) {
       const metaData = {
           block: this._getMentionContentBlock(contentBlocks,mention),
           data: getImageObject(mention.src,mention.name,mention.description)
       };
       return this.constructSocial(editorState,metaData)
    },


    onCreateNewLink(titleValue,urlValue,descValue) {

        urlValue = appendHttp(urlValue);

        const entityKey = this.createLinkEntity(titleValue,urlValue,descValue);
        const {editorState} = this.state;

        const e = Entity.get(entityKey).getData();
        console.log(e);

        let _editorState = RichUtils.toggleLink(
            editorState,
            editorState.getSelection(),
            entityKey
        );
        this.onPublishEditorState(_editorState);
    },

    onEditLink(titleValue,urlValue,descValue,linkEntityKey) {
        Entity.mergeData(linkEntityKey, {
            linkTitle: titleValue,
            linkUrl: urlValue,
            linkDesc: descValue
        });
    },

    onCreateNewImage (url,description,title) {
        const entityKey = this._createImageSocialEntity(url,description,title);
        const {editorState} = this.state;
        this.onPublishEditorState(this._insertEntityKey(editorState,entityKey));
    },

    _createImageSocialEntity(url,description,title) {
        const urlType = isImageLink(url) ? 'IMAGE' : 'SOCIAL';
        const entityKey = Entity.create(urlType, 'IMMUTABLE',
            {
                src: url ,
                description,
                title,
                editCallback: this.state.imageEditCallback
            });
        return entityKey;
    },

    _insertEntityKey(editorState, entityKey) {
        const newEditorState = AtomicBlockUtils.insertAtomicBlock(
            editorState,
            entityKey,
            ' '
        );
        return EditorState.forceSelection(
            newEditorState,
            editorState.getCurrentContent().getSelectionAfter()
        );
    },

    onEditImage(src,description,title,linkEntityKey) {
        Entity.mergeData(linkEntityKey, {
            src,
            description
        });
    },



    onRemoveLink(linkEntityKey) {
        const {editorState} = this.state;
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
       this.onPublishEditorState(_editorState);
    }


});