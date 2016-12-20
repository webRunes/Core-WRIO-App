import Reflux from 'reflux';
import WrioActions from '../actions/wrio.js';
import { getRegistredUser} from '../webrunesAPI.js';
import {getWidgetID} from '../webrunesAPI.js';

export default Reflux.createStore({
    listenables: WrioActions,
    init() {
        this.state= {
            wrioID: '',
            commentsEanbled: false,
            busy: false
        };
        getRegistredUser().then((wrioID)=> {
            this.state.wrioID = wrioID;
            this.trigger(this.state);
            }
        ).catch((e)=> console.error("ERROR obtaining",e.stack));
    },

    getWrioID() {
        return this.state.wrioID;
    },

    requestCommentId(url,cb) {
        if (!this.state.commentsEnabled) {
            console.log("getCommentId canceled, because comments not enabled");
            return cb(null,"");
        }
        console.log("getCommentid started");
        getWidgetID(url).then((id)=> {
            console.log("Get widget id succeded", id);
            cb(null,id);
        }).catch((e) => {
            console.log("Failed to obtain widget ID");
            cb('Failure obtaining commentId');

        });
    },

    onCommentsEnabled(state) {
        this.state.commentsEnabled = state;
    },

    areCommentsEnabled () {
        return this.state.commentsEnabled;
    },

    onHeaderChanged(header) {
        this.state.header = header;
        this.trigger(this.state);
    },

    onBusy(state) {
        this.state.busy = state;
        this.trigger(this.state);
    }

});