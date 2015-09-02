'use strict';

(function($) {
	var $textarea, $textarea_widget, $saveBtn, $saveAsBtn;
	var startHeader = '<h2>';
	var endHeader = '</h2>';
	var cleshe = '<!DOCTYPE html><html lang="en-US"><head><meta charset="utf-8">' +
		'<meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
		'<meta name="description" content=""><meta name="author" content=""><meta name="keywords" content="">' +
		'<title>|TITLE|</title><script type="application/ld+json">|BODY|</script>' +
		'</head><body><script type="text/javascript" src="//wrioos.com/start.js"></script></body></html>';

	var getArticle = function(lang, keywords, author, widgetData) {
		return {
			"@context": "http://schema.org",
			"@type": "Article",
			"inLanguage": lang,
			"keywords": keywords,
			"author": author,
			"editor": "",
			"name": "",
			"about": "",
			"articleBody": [],
			"hasPart": [],
			"mentions": [],
			"comment": widgetData
		};
	};
	var replaceLineFeed = function (someText) {
		var re=/\r\n|\n\r|\n|\r/g;
		return someText.replace(re,"");
	};
	var getMentionsItem = function(name, about, link){
		return {
			"@type": "Article",
			"name": name,
			"about": about,
			"url": link
		};
	};
	var getPart = function(name) {
		return {
			"@type": "Article",
			"name": name,
			"articleBody": []
		};
	};
	var destroyClickedLink = function(event) {
		document.body.removeChild(event.target);
	};
	var normalizeText = function(text) {
		text = text.replace(/<p>/gi, '')
			.replace(/<\/p>/gi, '<br>');
		text = text.replace(/<div>/gi, '')
			.replace(/<\/div>/gi, '<br>');
		text = text.replace(/<br><br>/gi, '<br>');
		text = text.replace(/<br><\/li>/gi, '</li>');

		text = normalizeQuote(text);
		return text;
	};
	var normalizeOUL = function(arr) {
		var regOl = /<ol>/gi;
		var regUl = /<ul>/gi;
		var list = [];
		for (var i = 0; i < arr.length; i++) {
			if (regOl.test(arr[i])) {
				convertOUlToList(list, arr[i], 0);
			} else if (regUl.test(arr[i])) {
				convertOUlToList(list, arr[i], 1);
			} else {
				list.push(arr[i]);
			}
		}
		return list;
	};
	var normalizeQuote = function(txt) {
		var reg = /(<blockquote>([\s\S]+?)<\/blockquote>)/gi;

		var blocks = txt.match(reg);
		if (!blocks || !blocks.length) return txt;

		for (var i = 0; i < blocks.length; i++) {
			var item = blocks[i].replace('<blockquote>', '<br>')
				.replace('</blockquote>', '<br>');
			var ps = item.split('<br>');
			var newBlocks = ['<br>'];
			for (var j = 0; j < ps.length; j++) {
				if (ps[j]) {
					ps[j] = '> ' + ps[j] + '<br>';
					newBlocks.push(ps[j]);
				}
			}
			txt = txt.replace(blocks[i], newBlocks.join(''));
		}

		return txt;
	};
	var normalizeWidgetData = function(widgetData) {
		var data_widget_id = widgetData.match(/([^0-9])/i);
		if (data_widget_id) {
			var result = widgetData.match(/data-widget-id=\"([0-9]+)\"/i);
			if (result) {
				data_widget_id = result[1];
			} else {
				return "";
			}
		} else {
			data_widget_id = widgetData;
		}
		return data_widget_id;
	};
	var convertOUlToList = function(list, txt, isOu) {
		txt = txt.replace(/<ol>/gi, '<br>')
			.replace(/<ul>/gi, '<br>')
			.replace(/<\/ol>/gi, '<br>')
			.replace(/<\/ul>/gi, '<br>')
			.replace(/<\/li>/gi, '<br>');
		var arr = txt.split('<br>');

		var ind = 1;
		for (var i = 0; i < arr.length; i++) {
			var text = arr[i];
			if (text) {
				if (arr[i].indexOf('<li>') == 0) {
					var num = ind + '. ';
					if (!!isOu) num = '* ';
					text = text.replace('<li>', num);
					ind += 1;
				}
				list.push(text);
			}
		}
	};
	var calculateJson = function(text, widgetData) {
		if (!text) return '';

		text = normalizeText(text);
		widgetData = normalizeWidgetData(widgetData);

		var blocks = text.split(startHeader);
		if (!blocks.length) return '';

		var i = !blocks[0] ? 1 : 0;
		var j = i;
		var article = getArticle("en-US", "", "", widgetData);
		var num = 1;
		for (; i < blocks.length; i++) {
			if (i == j) num = addCoreBlock(article, blocks[i], num);
			else num = addParagraph(article, blocks[i], num);
		}

		return article;
	};
	var checkMention = function(arr, txt, num) {
		var reg1 = /<a/i;
		var reg2 = /<\/a>/i;
		var regHref = /href=["|']([^'"]+)/i;
		var regTitle = /<a [^>]+>([^<]+)<\/a>/i;

		var ind;
		while ((ind = txt.search(reg1)) >= 0) {
			var end = txt.search(reg2) + 4;
			var a = txt.substring(ind, end);

			var name = regTitle.exec(a)[1];
			var link = regHref.exec(a)[1];
			link += "?'" + name + "':" + num + "," + ind;

			txt = txt.replace(a, name);
			var ment = getMentionsItem(name, '', link);
			arr.push(ment);
		}
		return txt;
	};
	var addCoreBlock = function(json, txt, num) {
		if (!txt) return num;
		var blocks = txt.split(endHeader);

		json.name = blocks.length == 2 ? blocks[0] : '';

		var ps = blocks[blocks.length - 1].split('<br>');
		ps = normalizeOUL(ps);
		for (var i = 0; i < ps.length; i++) {
			ps[i] = ps[i].replace(/&nbsp;/gi, ' ');
			var p = checkMention(json.mentions, ps[i], num);
			p = replaceLineFeed(p);
			json.articleBody.push(p);
			num += 1;
		}

		return num;
	};
	var addParagraph = function(json, txt, num) {
		if (!txt) return num;

		var blocks = txt.split(endHeader);
		var part = getPart(blocks[0]);

		var ps = blocks[1].split('<br>');
		ps = normalizeOUL(ps);
		for (var i = 0; i < ps.length; i++) {
			ps[i] = ps[i].replace(/&nbsp;/gi, ' ');
			var p = checkMention(json.mentions, ps[i], num);
			p = replaceLineFeed(p);
			part.articleBody.push(p);
			num += 1;
		}

		json.hasPart.push(part);

		return num;
	};
	var onClickSave = function() {
		var widgetData = $($textarea_widget)
			.val();
		var txt = $($textarea)
			.val();
		var json = calculateJson(txt, widgetData);
		if (!json) return;

		var textToWrite = cleshe.replace('|BODY|', JSON.stringify(json));
		textToWrite = textToWrite.replace('|TITLE|', json.name);

		//ToDo: test
		console.log(textToWrite);
		var url = "zope.html";
		var contents = "<html></html>";
		$.ajax({
				//			url: "http://localhost:5002/api/save",
				url: "http://storage.webrunes.com/api/save",
				type: 'post',
				'dataType': 'json',
				//            'fileData': imageData,
				data: {
					'url': url,
					'bodyData': textToWrite
				},
				xhrFields: {
					withCredentials: true
				}
			})
			.success(function(res) {
				window.location = res.url;
			});
	};
	var onClickSaveAs = function() {
		var widgetData = $($textarea_widget)
			.val();
		var txt = $($textarea)
			.val();
		var json = calculateJson(txt, widgetData);
		if (!json) return;

		var textToWrite = cleshe.replace('|BODY|', JSON.stringify(json));
		textToWrite = textToWrite.replace('|TITLE|', json.name);

		//ToDo: test
		console.log(textToWrite);
		var url = "zope.html";
		var contents = "<html></html>";

		var textFileAsBlob = new Blob([textToWrite], {
			type: 'text/plain'
		});

		var downloadLink = document.createElement("a");
		json
		downloadLink.download = (json.name === '' ? 'untitled' : json.name.split(' ')
			.join('_')) + '.htm';
		downloadLink.innerHTML = "My Hidden Link";

		window.URL = window.URL || window.webkitURL;

		downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
		downloadLink.onclick = destroyClickedLink;
		downloadLink.style.display = "none";
		document.body.appendChild(downloadLink);

		downloadLink.click();
	};
	var init = function() {
		$saveBtn = $('#save-button-id')
			.on('click', onClickSave);
		$saveAsBtn = $('#save-as-button-id')
			.on('click', onClickSaveAs);
		$textarea = $('#textarea-core-id');
		$textarea_widget = $('#textarea-widget-id');
	};
	init();
})(jQuery);
