import sortBy from 'lodash.sortby';

export class Mention {

    constructor(opts) {
        this.name = opts.name;
        this.url = opts.url;
        var cutUrl = this.url.split('\''),
            positions = cutUrl[2].replace(':', '').split(',');
        this.linkWord = cutUrl[1];
        this.newUrl = cutUrl[0] + this.name.replace(/\s/g, '-');
        this.order = Number(positions[0]);
        this.start = Number(positions[1]);
    }

    warn(text) {
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
}

export function merge(mentions) {
    return sortBy(mentions, (m) => {
        var mention = new Mention(m);
        return mention.order;
    });
}
