import React from 'react';
import Modal from 'react-modal';

import {Entity} from 'draft-js';



export default class LinkUrlDialog extends React.Component {
    constructor(props) {
        super(props);
        this.onEditLink = this.onEditLink.bind(this);
        this.onConfirmLink = this.onConfirmLink.bind(this);
        this.onTitleChange = this.onTitleChange.bind(this);
        this.onUrlChange = this.onUrlChange.bind(this);
        this.onDescChange = this.onDescChange.bind(this);  
        this.onCancelLink = this.onCancelLink.bind(this);
        this.onRemoveLink = this.onRemoveLink.bind(this);


        console.log(this.props.titleValue);

        this.state = {
            titleValue: this.props.titleValue,
            urlValue: '',
            descValue: ''
        };

    }
    onEditLink(e) {
        e.preventDefault();
        const {titleValue, urlValue, descValue, linkEntityKey} = this.state;
        this.props.onEditLink(titleValue,urlValue,descValue);
    }
    onConfirmLink(e) {
      e.preventDefault(e);
      const {titleValue, urlValue, descValue} = this.state;
      this.props.onConfirmLink(titleValue,urlValue,descValue);
    }

    editLink(e) {
        e.preventDefault();
        const {
            titleValue, urlValue, descValue, linkEntityKey
            } = this.state;
        Entity.mergeData(linkEntityKey, {
            linkTitle: titleValue,
            linkUrl: urlValue,
            linkDesc: descValue
        });
        this.setState({
            showURLInput: 0,
            isEditLink: 0,
            linkEntityKey: 0,
            titleValue: '',
            urlValue: '',
            descValue: ''
        }, () => {
            setTimeout(() => this.refs.editor.focus(), 0);
        });
    }

    onTitleChange(e) {
        this.setState({
            titleValue: e.target.value
        });
    }
    onUrlChange(e) {
        this.setState({
            urlValue: e.target.value
        });
    }
    onDescChange(e) {
        this.setState({
            descValue: e.target.value
        });
    }
    onCancelLink(e) {
        e.preventDefault();
        this.props.onCancelLink(e);
    }
    onRemoveLink(e) {
        e.preventDefault();
        this.props.onRemoveLink(e);
    }
    render() {
        const customStyles = {
          overlay : {
            position          : 'fixed',
            top               : 0,
            left              : 0,
            right             : 0,
            bottom            : 0,
            backgroundColor   : 'rgba(255, 255, 255, 0.75)',
            zIndex            : 10
          },
          content : {
            top                   : '50%',
            left                  : '50%',
            right                 : 'auto',
            bottom                : 'auto',
            marginRight           : '-50%',
            transform             : 'translate(-50%, -50%)'
          }
        };
        return (
            <div style={styles.linkTitleInputContainer}>
                <Modal shouldCloseOnOverlayClick={true} style={customStyles} isOpen={true}>
                    <div className="form-group">
                        <label htmlFor="linkTitle">Title: </label>
                        <input
                          onChange={this.onTitleChange}
                          ref="linkTitle"
                          id="linkTitle"
                          style={styles.linkTitleInput}
                          type="text"
                          value={this.props.titleValue}
                          className="form-control"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="linkUrl">Url: </label>
                        <input
                          onChange={this.onUrlChange}
                          id="linkUrl"
                          ref="linkUrl"
                          type="text"
                          value={this.props.urlValue}
                          className="form-control"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="linkDesc">Description: </label>
                        <textarea
                          onChange={this.onDescChange}
                          id="linkDesc"
                          ref="linkDesc"
                          type="text"
                          value={this.props.descValue}
                          className="form-control"
                        />
                    </div>
                    <div class="form-group">
                        <button onClick={this.props.isEditLink ? this.onEditLink : this.onConfirmLink} className="btn btn-primary">
                            Confirm
                        </button>
                        <button className="btn btn-warning" onClick={this.onCancelLink}>
                            Cancel
                        </button>
                        {this.props.isEditLink ? (<button className="btn btn-danger" onClick={this.onRemoveLink}>
                            Remove
                        </button>) : null}
                    </div>
                </Modal>
            </div>
        );
    }
};

LinkUrlDialog.propTypes = {
    onEditLink: React.PropTypes.func,
    onConfirmLink: React.PropTypes.func,
    onCancelLink: React.PropTypes.func,
    onRemoveLink: React.PropTypes.func,
    promptForEdit: React.PropTypes.func,
    isEditLink: React.PropTypes.bool,
    titleValue: React.PropTypes.string,
    urlValue: React.PropTypes.string,
    descValue: React.PropTypes.string
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