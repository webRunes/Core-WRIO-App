/**
 * Created by michbil on 07.08.16.
 */

import React from 'react';

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