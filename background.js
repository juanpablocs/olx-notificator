/*
@ author        : juanpablocs21@gmail.com
@ group         : terrasoft
@ version       : 1.0
@ name          : -
@ description   : -
*/


var _counter = 0;
// var location = 'lima';
var _domain = 'www.olx.com.pe';

var _path;

var opt = localStorage.getItem('olxOption') ? JSON.parse(localStorage.getItem('olxOption')) : {};

if(opt && opt.path)
  _path = opt.path;

function setLocation(loc){
  chrome.cookies.set({'name':'siteLocation','value':_domain.replace('www', loc), 'url':'http://' + _domain + '/*'}, function(e){
    opt.location = loc;
    opt.domain = _domain;
    localStorage.setItem('olxOption', JSON.stringify(opt));
  });
}

function formatDate(dd){
  var d = dd.replace(/[\s]+/,'');
  var date = new Date();
  if(/^H/.test(d)){
    return date.toString().replace(/\d+:\d+:\d+/,d.replace(/[a-zA-Z,\s]+/,'').trim() + ':58');
  }else if(/^A/.test(d)){
    date.setDate(date.getDate()-1);
    return date.toString().replace(/\d+:\d+:\d+/,d.replace(/[a-zA-Z,\s]+/,'').trim() + ':58');
  }else{
    var dateParsed = d.replace('Ago','august') + '2016';
    return new Date(Date.parse(dateParsed)).toString();
  }
}

function runNotification(item){
  chrome.notifications.create(
    'http://' + _domain + '/jpmaster-iid-'+item.id, 
    {   
      type: 'basic',
      iconUrl: item.image, 
      title: '[OLX] ' + item.title.replace(/<(.+)>/,' '), 
      message: item.location + ' ' + item.date,
      priority: 1
    },
    function(e) {  console.log(e); } 
  );      
}

function requestPage(cb){
  if(!_path)
    return;
  var xhr;
  xhr = new XMLHttpRequest();
  xhr.addEventListener('load',function(){
    var response  = xhr.responseText.replace(/[\s\t]+/g,' ');


    var subcategories = response.match(/<ul class="sub-categories">(.*?)<\/ul>/)[1];
    var itemsSubcategories = subcategories.match(/<li>(.*?)<\/li>/g);
    var subs = [];

    itemsSubcategories.forEach(function(val){
      var obj = {
        path:/href="\/\/(?:.*?)\/([^"]+)"/g.exec(val)[1],
        name:/<h2>(.*?)<\/h2>/.exec(val)[1]
      };
      subs.push(obj);
    });
    if(subs.length>0){
      x = JSON.parse(localStorage.getItem('olxOption'));
      subs.unshift({path:x.path,name:x.pathName});
      localStorage.setItem('olxSubcategories', JSON.stringify(subs))
    }

    var itemsUl     = response.match(/<ul class="items-list\s">(.*?)<\/ul>/)[1];
    var items = itemsUl.match(/<li(?:[^>]+)>(.*?)<\/li>/g);
    var itemsOutput = [];

    items.forEach(function(item){
      var iid = /iid-([^"]+)" data-qa="list-item"/.exec(item)[1];
      var iimage = /<img src="([^"]+)"/g.exec(item) ? /<img src="([^"]+)"/g.exec(item)[1] : null;
      var ilocation = /<span class="displayLocation">(.*?)<\/span>/g.exec(item) ? /<span class="displayLocation">(.*?)<\/span>/g.exec(item)[1] : null
      var obj = {
        id: iid,
        title: /<h3>(.*?)<\/h3>/g.exec(item)[1],
        image: iimage,
        location: ilocation,
        price: /<p class="items-price">(.*?)<\/p>/g.exec(item)[1].replace(/<(.+)>/,' '),
        date: /<p class="items-date">(.*?)<\/p>/g.exec(item)[1].replace(/<(.+)>/,' '),
        featured: /<p class="featuredad">(.*?)<\/p>/g.exec(item),
      };
      itemsOutput.push(obj);
    });

    itemsOutput = itemsOutput.sort(function(a,b){ 
      return new Date(formatDate(b.date)) - new Date(formatDate(a.date))
    });

    var olxLastItem = localStorage.getItem('olxLastItem');
    var itemLastDate = formatDate(itemsOutput[0].date);
    var itemLast = {'item':itemsOutput[0], 'date': itemLastDate};

    if(!olxLastItem){
      localStorage.setItem('olxLastItem', JSON.stringify(itemLast))
    }else{
      var d = JSON.parse(olxLastItem);
      if(new Date(itemLastDate) > new Date(d.date)){
        localStorage.setItem('olxLastItem',  JSON.stringify(itemLast));
        console.log('NOTIF', itemLast);
        runNotification(itemLast.item);
        _counter++;
      }
    }
    
    localStorage.setItem('olxRequestSuccess', JSON.stringify(itemsOutput));
    localStorage.setItem('olxRequestError',null);
    cb(itemsOutput);
  });
  xhr.addEventListener('error',function(){
    localStorage.setItem('olxRequestError','1');
  });
  xhr.open("GET", 'https://' + _domain + _path, true);
  xhr.send(null);
}

chrome.alarms.create("olxAlarm", {periodInMinutes: 0.2} );

chrome.alarms.onAlarm.addListener(function(alarm) {
  requestPage(function(html){
    console.log('loaded');
    if(_counter)
      chrome.browserAction.setBadgeText({text: _counter.toString()}); 
  });
});

// notification click event
chrome.notifications.onClicked.addListener(function(url){
  chrome.browserAction.setBadgeText({'text':''})
  _counter = 0;
  chrome.tabs.create({url:  url});
});

chrome.extension.onConnect.addListener(function(port) {
  console.log("click popup");
  
  chrome.browserAction.setBadgeText({'text':''});

  port.onMessage.addListener(function(obj) {
    switch(obj.option){
      case 'selectCategory':
        _path = obj.path;
      break;
      case 'selectLocation':
        setLocation(obj.value);
      break;
      default:
      break;
    }
    // setLocation(loc);
    requestPage(function(){});
  });
});


