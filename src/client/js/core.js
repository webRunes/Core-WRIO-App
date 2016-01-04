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

	var domain = process.env.DOMAIN;
	var wrioID;
	var saveUrl;
	var STORAGE_DOMAIN = "wr.io";


	// helper func
	function getLocation(href) {
		var match = href.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)(\/[^?#]*)(\?[^#]*|)(#.*|)$/);
		return match && {
				protocol: match[1],
				host: match[2],
				hostname: match[3],
				port: match[4],
				pathname: match[5],
				search: match[6],
				hash: match[7]
			}
	}

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
			"name": name
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

		var name = blocks.length == 2 ? blocks[0] : '';
		name = checkMention(json.mentions, name, 1);
		name = replaceLineFeed(name);

		json.name = name;

		var ps = blocks[blocks.length - 1].split('<br>');
		ps = normalizeOUL(ps);
		for (var i = 0; i < ps.length; i++) {
			ps[i] = ps[i].replace(/&nbsp;/gi, ' ');
			var p = checkMention(json.mentions, ps[i], num + 2);
			p = replaceLineFeed(p);
			json.articleBody.push(p);
			num += 1;
		}

		return num;
	};
	var addParagraph = function(json, txt, num) {
		if (!txt) return num;
		var regHttp = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/i;
		var regTitle = /<a [^>]+>([^<]+)<\/a>/i;
		var blocks = txt.split(endHeader);
		
		var name = blocks[0];
		name = checkMention(json.mentions, name, num + 1);
		name = replaceLineFeed(name);
		
		var part = getPart(name);

		var ps = blocks[1].split('<br>');
		ps = normalizeOUL(ps);
		for (var i = 0; i < ps.length; i++) {
			if (ps[i].search(regHttp) === -1) {
				part.articleBody = part.articleBody || [];
				ps[i] = ps[i].replace(/&nbsp;/gi, ' ');
				var p = checkMention(json.mentions, ps[i], num + 2);
				p = replaceLineFeed(p);
				part.articleBody.push(p);
				num += 1;
			} else {
				part.url = regTitle.exec(ps[i])[1];
			}
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
		var url = saveUrl;
		var contents = "<html></html>";
		$.ajax({
				url: "http://storage."+domain+"/api/save",
				type: 'post',
				'dataType': 'json',
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

	var disableSave = function () {
		$('#save-button-id div a').addClass('disabled');
		$('#save-button-id div').attr('title', 'You can\'t save to non webrunes hosted page. Use \"Save As\" and upload file manually');
	}

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

		var ie = navigator.userAgent.match(/MSIE\s([\d.]+)/);
		var ie11 = navigator.userAgent.match(/Trident\/7.0/) && navigator.userAgent.match(/rv:11/);
		var ieEDGE = navigator.userAgent.match(/Edge/g);
		var ieVer=(ie ? parseInt(ie[1]) : (ie11 ? 11 : -1));

		var fileName = (json.name === '' ? 'untitled' : json.name.split(' ').join('_')) + '.htm';
		if (ie || ie11 || ieEDGE) {
			if (ieVer>9 || ieEDGE) {
				var textFileAsBlob = new Blob([textToWrite], {
					type: 'text/plain'
				});
				window.navigator.msSaveBlob(textFileAsBlob, fileName);
			} else {
				console.log("No supported on IE ver<10");
				return;
			}
		} else {
			var downloadLink = document.createElement("a");
			downloadLink.download = fileName;
			downloadLink.innerHTML = "My Hidden Link";

			window.URL = window.URL || window.webkitURL;
			textFileAsBlob = new Blob([textToWrite], {
				type: 'text/plain'
			});
			downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
			downloadLink.onclick = destroyClickedLink;
			downloadLink.style.display = "none";
			document.body.appendChild(downloadLink);

			downloadLink.click();
		}
	};

	function parseEditingUrl() {
		var editUrl = window.location.search.match(/\?article=([\.0-9a-zA-Z%:\/?]*)/);
		if (editUrl) {
			editUrl = editUrl[1];
			var editUrlParsed = getLocation(editUrl);
			console.log("Got editing url", editUrl);
			console.log(editUrlParsed);
			if (editUrlParsed) {
				if (editUrlParsed.host == STORAGE_DOMAIN) {
					var match = editUrlParsed.pathname.match(/\/[0-9]+\/(.*)/);
					if (match) {
						saveUrl = match[1];
						if (saveUrl == "") {
							saveUrl = "index.htm"; // if no file specified, let's assume this is index.htm
						}
						return;
					}
				}
			}
		}
		disableSave();
	}

	var init = function() {
		$saveBtn = $('#save-button-id')
			.on('click', onClickSave);
		$saveAsBtn = $('#save-as-button-id')
			.on('click', onClickSaveAs);
		$textarea = $('#textarea-core-id');
		$textarea_widget = $('#textarea-widget-id');


		parseEditingUrl();

		$.ajax({
			url: "//storage."+domain+"/api/get_profile",
			type: 'post',
			'dataType':'json',
			data: {},
			xhrFields: {
				withCredentials: true
			}
		}).success(function (profile) {
			console.log("Get_profile finish",profile);
			wrioID = profile.id;

		}).fail(function (e) {
			disableSave();
		});


	};
	init();
})(jQuery);
