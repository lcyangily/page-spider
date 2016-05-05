//引入express服务器
var spider = require('./spider.js');
var url = 'http://themehats.com/themes/jango/index.html',
	targetDir = '../html-template/jango',
    override = false;

/*spider.fetch(url, targetDir, override, function(){
	console.log('fetch page end .');
});*/

spider.fetchAll(url, targetDir, override, function(){
    console.log('fetch page complete.');
});

//spider.test('http://be.beantownthemes.com/html/content/bistro/css/bistro.css', targetDir);