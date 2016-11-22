import Reflux from 'reflux';
import WrioActions from '../actions/wrio.js';
import { getRegistredUser} from '../webrunesAPI.js';

export default Reflux.createStore({
    listenables: WrioActions,
    init() {
        this.state= {
            wrioID: ''
        };
        getRegistredUser().then((wrioID)=> {
            this.state = {wrioID};
            this.trigger(this.state);
            }
        ).catch((e)=> console.error(e.stack));
    },
    getWrioID() {
        return this.state.wrioID;
    }

});