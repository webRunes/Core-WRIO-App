import React from 'react';
import Modal from 'react-modal';


export default class LinkUrlDialog extends React.Component {
    constructor(props) {
        super(props);
        this.onEditLink = this.onEditLink.bind(this);
        this.onConfirmLink = this.onConfirmLink.bind(this);
        this.onTitleChange = this.onTitleChange.bind(this);
        this.onUrlChange = this.onUrlChange.bind(this);
        this.onDescChange = this.onDescChange.bind(this);
        this.onTitleInputKeyDown = this.onTitleInputKeyDown.bind(this);
        this.onUrlInputKeyDown = this.onUrlInputKeyDown.bind(this);
        this.onDescInputKeyDown = this.onDescInputKeyDown.bind(this);    
        this.onCancelLink = this.onCancelLink.bind(this);
        this.onRemoveLink = this.onRemoveLink.bind(this);
    }
    onEditLink(e) {
        e.preventDefault();
        this.props.onEditLink(e);
    }
    onConfirmLink(e) {
        e.preventDefault();
        this.props.onConfirmLink(e);
    }
    onTitleChange(e) {
        this.props.onTitleChange(e);
    }
    onUrlChange(e) {
        this.props.onUrlChange(e);
    }
    onDescChange(e) {
        this.props.onDescChange(e);
    }
    onTitleInputKeyDown(e) {
        this.props.onTitleInputKeyDown(e);
    }
    onUrlInputKeyDown(e) {
        this.props.onUrlInputKeyDown(e);
    }
    onDescInputKeyDown(e) {
        this.props.onDescInputKeyDown(e);
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
                          onClick={this.onTitleInputKeyDown}
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
                          onClick={this.onUrlInputKeyDown}
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
                          onClick={this.onDescInputKeyDown}
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
    onTitleChange: React.PropTypes.func,
    onUrlChange: React.PropTypes.func,
    onDescChange: React.PropTypes.func,
    onTitleInputKeyDown: React.PropTypes.func,
    onUrlInputKeyDown: React.PropTypes.func,
    onDescInputKeyDown: React.PropTypes.func,
    onCancelLink: React.PropTypes.func,
    onRemoveLink: React.PropTypes.func,
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