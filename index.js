//引入express服务器
var spider = require('./spider.js');
var url = 'http://www.inspirothemes.com/polo-v2/preview/index.html',
	targetDir = 'polo-v2',
    override = false;

/*spider.fetch(url, targetDir, override, function(){
	console.log('fetch page end .');
});*/

spider.fetchAll(url, targetDir, override, function(){
    console.log('fetch page complete.');
});

//spider.test('http://be.beantownthemes.com/html/content/bistro/css/bistro.css', targetDir);