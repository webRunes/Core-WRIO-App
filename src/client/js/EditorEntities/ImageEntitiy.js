import React from 'react';
import {CompositeDecorator, ContentState, SelectionState, Editor, EditorState, Entity, RichUtils, CharacterMetadata, getDefaultKeyBinding,  Modifier} from 'draft-js';


// image template component for the editor

export default class ImageEntity extends React.Component {
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
            <img src={this.linkUrl} onClick={this.onLinkEdit.bind(this)}>{this.linkTitle}</img>
        );
    }
}

Link.propTypes = {
    entityKey: React.PropTypes.string,
    children: React.PropTypes.array
};