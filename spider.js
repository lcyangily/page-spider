var cheerio = require('cheerio');
var _ = require('lodash');
var request = require('request');
var async   = require('async');
//var he      = require('he');
var moment  = require('moment');
var parseString  = require('xml2js').parseString;
var fs = require('fs');
var path = require('path');
var url = require('url');
var iconv = require('iconv-lite');

function mkdirsSync(dirpath, mode) { 
    if (!fs.existsSync(dirpath)) {
        var pathtmp;
        dirpath.split(path.sep).forEach(function(dirname) {
            if (pathtmp) {
                pathtmp = path.join(pathtmp, dirname);
            }
            else {
                pathtmp = dirname;
            }
            if (!fs.existsSync(pathtmp)) {
                if (!fs.mkdirSync(pathtmp, mode)) {
                    return false;
                }
            }
        });
    }
    return true; 
}

function saveFile(urlStr, buf, targetDir, callback) {

    var urlObj = url.parse(urlStr);
    var pathUrl = path.join(targetDir, urlObj.path);
    var pathDir = path.dirname(pathUrl);
    var fileName = path.basename(pathUrl);
    var extName = path.extname(pathUrl);
    if(!fileName) {
        return;
    }

    if(!mkdirsSync(pathDir)) {
        return;
    }

    var encoding = 'binary';
    if(extName == '.css' || extName == '.html' || extName == '.htm' || extName == '.js') {
        encoding = 'utf-8';
    }

    fs.writeFile(pathUrl, buf, { encoding: encoding }, callback);
}

function saveFileByUrl (urlStr, targetDir, override, listObj, callback) {

    if(!urlStr) {
        nextLoad();
        return;
    }
    var urlObj = url.parse(urlStr);
    var pathUrl = path.join(targetDir, urlObj.path);
    var pathDir = path.dirname(pathUrl);
    var fileName = path.basename(pathUrl);
    var extName = path.extname(pathUrl);
    if(!fileName) {
        nextLoad();
        return;
    }

    if(!mkdirsSync(pathDir)) {
        nextLoad();
        return;
    }

    if (fs.existsSync(pathUrl) && !override) {
        console.log("==> exists : " + urlStr);
        nextLoad();
        return;
    }

    console.log("-> loading : " + urlStr);
    try {
        request(urlStr, {timeout : 10000}, function(e, r, body){
            if(extName == '.css') {
                var reg = /url\s*\(\s*([\'\"]{0,1})(.*?)\1\s*\)/g;
                var ret;
                var urls = [];
                while( (ret = reg.exec(body)) != null) {
                    //console.log(ret[2]);
                    if(ret[2]) {
                        urls.push(url.resolve(urlStr, ret[2]));
                    }
                }
                listObj.setUrls(urls);
            }
        })
        .pipe(fs.createWriteStream(pathUrl))
        .on('close', function(){
            console.log("++++++++++++++++ close +++++++++++++++++");
            return nextLoad();
        })
        .on('error', function(err){
            console.log("================ error.code : " + (err && err.code));
            return nextLoad();
        });
    } catch (e) {
        console.log("++++++++++++++++ exception +++++++++++++++++");
        return nextLoad();
    }

    function nextLoad() {
        if(listObj && listObj.hasNext()) {
            var urlS = listObj.getNext();
            saveFileByUrl(urlS, targetDir, override, listObj, callback);
        } else {
            return callback && callback();
        }
    }
}

function getPage(urlStr, targetDir, override, pageDownCallback, callback) {

    console.log('====================================================');
    console.log('====================================================');
    console.log('=== page url : ' + urlStr);
    console.log('====================================================');
    console.log('====================================================');

    var ListClass = function(){
        var list = [];
        var uniqueObj = {};
        var index = -1;
        this.setUrls = function(urls) {
            urls.forEach(function(it, i) {
                if(!uniqueObj[it]) {
                    uniqueObj[it] = true;
                    list.push(it);
                }
            });
        }

        this.getNext = function() {
            index++;
            if(list && list.length > index) {
                return list[index];
            } else {
                return null;
            }
        }
        this.hasNext = function() {
            return list && (list.length > index + 1);
        }
        this.getCurrentIndex = function() {
            return index;
        }
        this.getTotal = function() {
            return list && list.length;
        }
    }

    var listObj = new ListClass();

    request.get({
        url : urlStr
    }, function(e, r, body){
        if(e) {
            return callback && callback(e);
        }

        saveFile(urlStr, body, targetDir, function(){
            pageDownCallback && pageDownCallback(body);

            var list = [];
            var $ = cheerio.load(body, {
                decodeEntities: false
            });

            $('img,script').each(function(i, item){
                var $it = $(item);
                var src = $it.attr('src');
                if(src) {
                    list.push(src);
                }
            });

            $('link').each(function(i, item){
                var $it = $(item);
                var href = $it.attr('href');
                if(href) {
                    list.push(href);
                }
            });

            for(var i = 0; i < list.length; i++) {
                if(list[i] && !path.isAbsolute(list[i])) {
                    list[i] = url.resolve(urlStr, list[i]);
                } else {
                    list[i] = null;
                }
            }

            listObj.setUrls(list);
            
            var startUrl = listObj.getNext();
            console.log(' startUrl : ' + startUrl);
            console.log(' ****** download files : ' + listObj.getCurrentIndex() + '/' + listObj.getTotal() + "******");
            saveFileByUrl(startUrl, targetDir, override, listObj, callback);
        });
    });
}

function getPageInterval(urlStr, targetDir, override, pageListObj, allDownCallback) {

    var urlObj = url.parse(urlStr);
    var pathUrl = path.join(targetDir, urlObj.path);

    //已存在跳过下载页面前提：不是第一个页面！
    //至少加载一个页面后其他页面才能跳转，如果第一个页面就存在，否则可能一次都不执行
    if (fs.existsSync(pathUrl) && !override && pageListObj.getCurrentIndex() > -1) {
        console.log('=== page exists : ' + urlStr);
        return nextFunc();
    }

    function nextFunc(){
        //当前页面内容获取完毕，下一个页面
        if(pageListObj.hasNext()) {
            getPageInterval(pageListObj.getNext(), targetDir, override, pageListObj, allDownCallback);
        } else {
            allDownCallback && allDownCallback();
        }
    }

    getPage(urlStr, targetDir, override, function(body){

        //解析body 获取更多页面 a
        var urls = [];
        var $ = cheerio.load(body, {
            decodeEntities: false
        });

        $('a[href]').each(function(i, it){
            var href = $(it).attr('href');
            var extName = path.extname(href);
            if(extName && (extName == '.html' || extName == '.htm')) {
                var curl = url.resolve(urlStr, href);
                urls.push(curl);
            }
            
        });
        //console.log("urls : " + urls);
        pageListObj.setUrls(urls);

    }, nextFunc);
}

exports.fetch = function(urlStr, targetDir, override, callback) {

    getPage(urlStr, targetDir, override, null, callback);
}


exports.fetchAll = function(urlStr, targetDir, override, callback) {

    var PageListClass = function(){
        var pageList = [];
        var uniqueObj = {};
        var index = -1;
        var isFirst = true;
        this.setUrls = function(urls) {
            urls.forEach(function(it, i) {
                if(!uniqueObj[it]) {
                    uniqueObj[it] = true;
                    pageList.push(it);
                }
            });
        }

        this.getNext = function() {
            index++;
            if(pageList && pageList.length > index) {
                return pageList[index];
            } else {
                return null;
            }
        }
        this.hasNext = function() {
            return pageList && (pageList.length > index + 1);
        }

        this.getCurrentIndex = function() {
            return index;
        }
        this.getTotal = function() {
            return pageList && pageList.length;
        }
    }

    var pageListObj = new PageListClass();

    getPageInterval(urlStr, targetDir, override, pageListObj, callback);
}

exports.test = function(urlStr, targetDir){

    var urlObj = url.parse(urlStr);
    var pathUrl = path.join(targetDir, urlObj.path);
    var pathDir = path.dirname(pathUrl);
    var fileName = path.basename(pathUrl);
    var extName = path.extname(pathUrl);

    var str = 'background-image: url(../images/top_bar_right_shadow1.png);'
    str += 'background-image: url("../images/top_bar_right_shadow2.png");'
    str += "background-image: url('../images/top_bar_right_shadow3.png');"
    str += "background-image: url ('../images/top_bar_right_shadow4.png');"
    str += "background-image: url ('../images/top_bar_right_sha";
    str += 'dow5.png");'
    request(urlStr, function(e, r, body){
        if(extName == '.css') {
            var reg = /url\s*\(\s*([\'\"]{0,1})(.*?)\1\s*\)/g;
            var ret;
            while( (ret = reg.exec(body)) != null) {
                console.log(ret[2]);
            }
        }
    });

    /*var reg = /url\s*\(\s*([\'\"]{0,1})(.*?)\1\s*\)/g;
    var ret;
    while( (ret = reg.exec(str)) != null) {
        console.log(ret[2]);
    }*/
}