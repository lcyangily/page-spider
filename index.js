//引入express服务器
var spider = require('./spider.js');
/*var url = 'http://monolit.kwst.net/index.html',
	targetDir = '../html-css-page-template/monolit',
    override = false;*/

/*spider.fetch(url, targetDir, override, function(){
	console.log('fetch page end .');
});*/




// rscard   http://rscard.px-lab.com/index.html

// progressive  http://template.progressive.itembridge.com/3.0.3/index.html

// Pivot   http://pivot.mediumra.re/chooser.html

// Spark   http://spark.design360studios.com/index.html

// BizOne   http://www.themesindustry.com/html/bizone/demos/index.html

// Focuson    http://astritbublaku.com/demos/focuson/index.html

// Borano   http://achtungthemes.com/borano/index.html

// Dani     http://www.spab-rice.com/themeforest/dani/index.html

// Polo-v2     http://www.inspirothemes.com/polo-v2/preview/index.html

// Pages     http://pages.revox.io/frontend/index.html

// KALLYAS    http://hogash-demos.com/kallyas_html/index.html
var list = [{
		url : 'http://www.spab-rice.com/themeforest/dani/index.html',
		targetDir : '../html-css-page-template/dani',
		override : true
	}/*{
		url : 'http://pillar.mediumra.re/index.html',
		targetDir : '../html-css-page-template/pillar',
		override : false
	}, {
		url : 'http://foundry.mediumra.re/chooser.html',
		targetDir : '../html-css-page-template/foundry',
		override : true
	}, {
		url : 'http://preview.oklerthemes.com/porto/4.9.0/index.html',
		targetDir : '../html-css-page-template/porto',
		override : true
	}, {
		url : 'http://rhythm.bestlooker.pro/intro.html',
		targetDir : '../html-css-page-template/rhythm',
		override : true
	}, {
		url : 'http://demo.themesease.com/salt-multi-purpose/index.html',
		targetDir : '../html-css-page-template/salt',
		override : true
	}, {
		url : 'http://www.themenesia.com/themeforest/archi-select/index.html',
		targetDir : '../html-css-page-template/Archi',
		override : true
	}, */];

var index = 0;
var current = list[index];
var total = list.length;
/*spider.fetchAll(url, targetDir, override, function(){
    console.log('fetch page complete.');
});*/

fetch(current);

function fetch(page) {
	spider.fetchAll(page.url, page.targetDir, page.override || false, function(){

	    console.log('fetch page complete.');
	    console.log('***************************************************');
	    console.log('***************************************************');
	    console.log(`${current.url} is fetch complete.`);
	    console.log('***************************************************');
	    console.log('***************************************************');

	    index++;
	    if(index >= total) {
	    	console.log('list fetch all complete.');
	    	return;
	    }
	    current = list[index];
	    
	    fetch(current);
	});
}

//spider.test('http://be.beantownthemes.com/html/content/bistro/css/bistro.css', targetDir);