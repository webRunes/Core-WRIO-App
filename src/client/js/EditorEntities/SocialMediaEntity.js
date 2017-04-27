import React from 'react';
import {CompositeDecorator, ContentState, SelectionState, Editor, EditorState, Entity, RichUtils, CharacterMetadata, getDefaultKeyBinding,  Modifier} from 'draft-js';
import request from 'superagent';


class Figure extends React.Component {
    render () {
        let figcaption = "";
        if (this.props.title) {
            figcaption = (
                <figcaption className="callout figure-details">
                    <h5>{this.props.title}</h5>
                    <p>{this.props.description}</p>
                </figcaption>);
        }
        return (
            <figure  style={{width:"50%"}}>
                {this.props.content}
                {figcaption}
            </figure>
        );
    }
}
Figure.propTypes = {
    title: React.PropTypes.string,
    description: React.PropTypes.string,
    content: React.PropTypes.object
};

// image template component for the editor


export default class SocialMediaEntity extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.getProps(props);
        this.onLinkEdit = this.onLinkEdit.bind(this);
    }

    getProps(props) {
        const {
            src,description,title,editCallback
            } = Entity.get(props.entityKey).getData();
        console.log(props.decoratedText);
        this.downloadEmebed( {
            sharedContent: {
                url: src
            }
        });
        return {
            html:"<img class=\"img_loading\" src=\"https://default.wrioos.com/img/loading.gif\" />",
            src,
            description,
            title,
            entityKey: props.entityKey,
            linkCallback: editCallback
        };
    }

    downloadEmebed(data) {
        if (data.sharedContent && data.sharedContent.url) {
            request.get('https://iframely.wrioos.com/oembed?url='+data.sharedContent.url, (err, result) => {
                if (err) {
                    console.error("Can't load embed ",data.sharedContent.url);
                }
                if (result.body.provider_name == 'Twitter') {
                    setTimeout(() => window.twttr.widgets.load(),1000); // hack to reload twitter iframes
                }
                if (result.body.type == 'link') {
                    this.setState({
                        type:"link",
                        object: result.body
                    });
                }
                console.log(result.body.html);
                this.setState({html:result.body.html});
            });
        }
    }

    onLinkEdit (e) {
        e.preventDefault();
        this.state.linkCallback(this.state.title, this.state.src, this.state.description, this.state.entityKey);
    }

    componentWillReceiveProps(props) {
        this.setState(this.getProps(props));
    }

    getContent() {
        if (this.state.type == 'link') {
            const data = this.state.object;
            return (<a href={data.url}><img src={data.thumbnail_url} alt={data.description}/></a>);
        }
        const htmlData = {__html: this.state.html};
        return  (<div dangerouslySetInnerHTML={htmlData} />);
    }

    render() {
        const content = this.getContent();
        const title = this.state.title;
        const description= this.state.description;
        return (<div onClick={this.onLinkEdit}>
                <Figure content={content} title={title} description={description}/>
            </div>);
    }
}

SocialMediaEntity.propTypes = {
    entityKey: React.PropTypes.string,
    children: React.PropTypes.array
};