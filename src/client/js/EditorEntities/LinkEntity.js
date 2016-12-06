/**
 * Created by michbil on 07.08.16.
 */

import React from 'react';
import {CompositeDecorator, ContentState, SelectionState, Editor, EditorState, Entity, RichUtils, CharacterMetadata, getDefaultKeyBinding,  Modifier} from 'draft-js';


// link template component for the editor

export default class Link extends React.Component {
    constructor(props) {
        super(props);
        this.getProps(props);
        this.onLinkEdit = this.onLinkEdit.bind(this);
    }

    getProps(props) {
        const {
            linkTitle, linkUrl, linkDesc, editCallback
            } = Entity.get(props.entityKey).getData();
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
        return (<a href={this.linkUrl} onClick={this.onLinkEdit}>{this.linkTitle}</a>);
    }
}

Link.propTypes = {
    entityKey: React.PropTypes.string,
    children: React.PropTypes.array
};