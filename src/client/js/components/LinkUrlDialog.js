import React from 'react';
import Modal from 'react-modal';
import TextEditorActions from '../actions/texteditor.js';
import LinkDialogActions from '../actions/linkdialog.js';
import LinkDialogStore from '../stores/linkDialog.js';


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

        this.state = LinkDialogStore.getInitialState();

        LinkDialogStore.listen(this.onStatusChange.bind(this));
    }

    onStatusChange(state) { // When s
        this.setState(state);
    }

    onTitleChange(e) {
        LinkDialogActions.titleChange(e.target.value);
    }
    onUrlChange(e) {
        LinkDialogActions.urlChange(e.target.value);
    }
    onDescChange(e) {
        LinkDialogActions.descChange(e.target.value);
    }

    onEditLink(e) {
        e.preventDefault();
        const {titleValue, urlValue, descValue,linkEntityKey} = this.state;
        TextEditorActions.editLink(titleValue,urlValue,descValue,linkEntityKey);
        LinkDialogActions.closeDialog();
    }
    onConfirmLink(e) {
        e.preventDefault(e);
        const {titleValue, urlValue, descValue} = this.state;
        TextEditorActions.createNewLink(titleValue,urlValue,descValue);
        LinkDialogActions.closeDialog();
    }

    onCancelLink(e) {
        e.preventDefault();
        LinkDialogActions.closeDialog();

    }

    onRemoveLink(e) {
        e.preventDefault();
        const {linkEntityKey} = this.state;
        TextEditorActions.removeLink(linkEntityKey);
        LinkDialogActions.closeDialog();
    }



    render() {

        if (!this.state.showURLInput){ return (<div></div>);}
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
            width                 : '380px',
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
                          value={this.state.titleValue}
                          className="form-control"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="linkUrl">URL: </label>
                        <input
                          onChange={this.onUrlChange}
                          id="linkUrl"
                          ref="linkUrl"
                          type="text"
                          value={this.state.urlValue}
                          className="form-control"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="linkDesc">Description: </label>
                        <textarea
                          onChange={this.onDescChange}
                          id="linkDesc"
                          ref="linkDesc"
                          rows="4"
                          type="text"
                          value={this.state.descValue}
                          className="form-control"
                        />
                    </div>
                    <div className="form-group pull-right">
                        {this.state.isEditLink ? (<button className="btn btn-danger btn-sm" onClick={this.onRemoveLink}><span className="glyphicon glyphicon-trash"></span>Remove</button>) : null}
                        <button className="btn btn-default btn-sm" onClick={this.onCancelLink}><span className="glyphicon glyphicon-remove"></span>Cancel</button>
                        <button onClick={this.state.isEditLink ? this.onEditLink : this.onConfirmLink} className="btn btn-primary btn-sm"><span className="glyphicon glyphicon-ok"></span>Submit</button>
                    </div>
                </Modal>
            </div>
        );
    }
};

LinkUrlDialog.propTypes = {
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