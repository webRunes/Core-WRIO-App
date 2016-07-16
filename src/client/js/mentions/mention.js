import sortBy from 'lodash.sortby';

class Mention {
    constructor(mention) {
        let {name, url} = mention,
            cutUrl = url.split('\''),
            positions = cutUrl[2].replace(':', '').split(',');
        this.linkWord = cutUrl[1];
        this.url = `${cutUrl[0]}${name.replace(/\s/g, '-')}`;
        this.block = Number(positions[0]);
        this.start = Number(positions[1]);
        this.end = this.start + this.linkWord.length;
    }
/*    warn(text) {
        text = text || 'Wrong mention: ' + this.url;
    }

    attach(s) {
        var before = s.substr(0, this.start),
            toReplace = s.substr(this.start, this.linkWord.length),
            after = s.substring(this.start + this.linkWord.length, s.length);
        if (toReplace === this.linkWord) {
            return {
                before: before,
                link: {
                    text: toReplace,
                    url: this.newUrl
                },
                after: after
            };
        }
        this.warn();
        return null;
    }
*/
}

const merge = (mentions)=>
    sortBy(mentions, (m)=>
        (new Mention(m)).order
    );


const extractMentions = (mentions) =>
    mentions.map(mention => 
        new Mention(mention)
    );

export {merge, extractMentions, Mention};
