function Jpmaster()
{
    this.init = true;
    
}

Jpmaster.prototype.loadHtml = function()
{
	var option = localStorage.getItem('olxOption') ? JSON.parse(localStorage.getItem('olxOption')) : {};
	var subcategories = JSON.parse(localStorage.getItem('olxSubcategories'));
	var port = chrome.extension.connect({name: "Sample Communication"});

	document.querySelector('.back').addEventListener('click', function(){
		this.style.display = 'none';
		option.path = null;
		localStorage.setItem('olxOption',JSON.stringify(option));
		document.getElementById('category').style.display = 'block';
		document.getElementById('popup').style.display = 'none';
		document.getElementById('selectLocation').style.display = 'none';
		document.getElementById('selectCategory').style.display = 'none';
	});
	
	if(option && option.path){
		document.getElementById('category').style.display = 'none';
		document.getElementById('popup').style.display = 'block';
		document.getElementById('selectLocation').style.display = 'block';
		document.querySelector('.back').style.display = 'block';
	}

	if(subcategories && option.path){
		document.getElementById('selectCategory').style.display = 'block';
		var x = [];
		subcategories.forEach(function(v){
			x.push('<option value="'+v.path+'">'+v.name+'</option>');
		});
		document.getElementById('selectCategory').innerHTML = x.join('');
	}

	if(option && option.path && option.location)
		document.getElementById('selectLocation').value = option.location;

	document.getElementById('selectLocation').addEventListener('change',function(){
		port.postMessage({'option':'selectLocation','value':this.value});
		window.close();
	});

	var lnks = document.querySelectorAll('.category');
	for (var i = 0; i < lnks.length; i++) {
		lnks[i].addEventListener('click', function(){
			var path = this.getAttribute('data-path');
			var pathName = this.getAttribute('data-path-name');
			port.postMessage({'option':'selectCategory','path':path,'pathName':pathName});
			document.getElementById('category').style.display = 'none';
			document.getElementById('popup').style.display = 'block';
			document.querySelector('.back').style.display = 'block';
			option.path = path;
			option.pathName = pathName;
			localStorage.setItem('olxOption', JSON.stringify(option));
		});
	}

	var local = localStorage.getItem('olxRequestSuccess');
	var _html = [];
	if(local){
		var items = JSON.parse(local);
		
		items.forEach(function(val){
			_html.push('<li><a href="http://' + option.domain + '/jpmaster-iid-'+val.id+'" target="_blank"><img src="'+val.image+'"/> <div class="titulo_left">'+val.title+' <span class="visitas">'+val.price+'</span> <p>'+val.location+' - '+val.date+'</p> </div> </a></li>');
		});

  	document.getElementById('popup').querySelector('ul').innerHTML = _html.join('');
	}
}

var a = new Jpmaster;

window.onload = a.loadHtml;
