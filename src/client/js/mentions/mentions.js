import {Mention, merge} from './mention';

var mentions = undefined;

var attachMentionToElement = function(mention, json, order) {
    order = order || 0;
    var i,
        keys = Object.keys(json);
    for (i = 0; i < keys.length; i += 1) {
        var key = keys[i];
        if (['name', 'about'].indexOf(key) !== -1) {
            order += 1;
            if (mention.order === order) {
                json.m = json.m || {};
                json.m[key] = json.m[key] || [];
                json.m[key].push(
                    mention.attach(json[key])
                );
                return true;
            }
        } else if (key === 'articleBody') {
            var articleBody = json[key],
                pos;
            if (order + articleBody.length >= mention.order) {
                pos = mention.order - order - 1;
                var _mention = mention.attach(articleBody[pos]);
                if (_mention) {
                    json.m = json.m || {};
                    json.m[key] = json.m[key] || [];
                    json.m[key][pos] = json.m[key][pos] || [];
                    json.m[key][pos].push(_mention);
                }
                return true;
            }
        }
    }
    return false;
};

export function check(json, order) {
    mentions = json.mentions || mentions;
    if (mentions) {
        mentions = merge(mentions);
        mentions.forEach((m) => {
            var mention = new Mention(m),
                ok;
            if (mention.order > (order || 0)) {
                ok = attachMentionToElement(mention, json, order);
            }
            if (ok === false) {
                mention.warn();
            }
        }, this);
    }
    if (json.hasPart) {
        var order = json.articleBody.length + 2;
        json.hasPart.forEach((part, i) => {
            if (i > 0) {
                order += json.hasPart[i-1].articleBody ? json.hasPart[i-1].articleBody.length + 1 : 1;
            }
            check(part, order);
        });
    }
};
