/**
 * Created by michbil on 10.08.16.
 */

/**
 * Created by michbil on 07.08.16.
 */
import Reflux from 'reflux';
import LinkActions from '../actions/linkdialog.js';
import TextEditorActions from '../actions/texteditor.js';

export default Reflux.createStore({
    listenables: LinkActions,
    init() {
        this.state = {
            showURLInput: false
        };
    },

    getInitialState: function() {
        return {
            titleValue: '',
            urlValue: '',
            descValue: '',
            showURLInput: false,
            isEditLink: false
        };

    },

    onOpenToCreate(titleValue, urlValue, descValue) {
        this.state = {
            showURLInput: true,
            isEditLink: false,
            titleValue,
            urlValue,
            descValue
        };
        this.trigger(this.state);
    },

    onOpenToEdit(titleValue, urlValue, descValue,linkEntityKey) {
        this.state = {
            showURLInput: true,
            isEditLink: true,
            titleValue,
            urlValue,
            descValue,
            linkEntityKey
        };
        this.trigger(this.state);
    },

    onCloseDialog() {
        this.state.showURLInput = false;
        this.trigger(this.state);
        TextEditorActions.focus();
    },

    onTitleChange(val) {
        this.state.titleValue = val;
        this.trigger(this.state);
    },

    onDescChange(val) {
        this.state.descValue = val;
        this.trigger(this.state);
    },

    onUrlChange(val) {
        this.state.urlValue = val;
        this.trigger(this.state);
    },

});