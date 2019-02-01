var u = new Url('https://kcws.spohr.eu', localStorage.getItem('authkey'), '/kc_kundeninfo/','/kc_artikel/','/kc_get_pdf/','/artikelimg/','/img/','https://spohr.arvatis.net/development/search?sSearch=', 1, 10,'desc','','all','','');
var c = new Customer(u.info_url+u.authkey);
var a = new Artikel();

(function(){
    if(!localStorage.authkey && window.location.pathname != '/login'){ localStorageClear(); }
    noCache();
    $('#year').text((new Date).getFullYear()); 
    c.getInfo();
    toggle($('.filter'), $('.search_wrapper'));
    window.onscroll = function() {scrollUp()};
})();

$(document).on('keyup', function(e) { if (e.keyCode == 27) { closePopup(); } });
$(document).on('mouseup', function(e) { var container = $(".popup_data"); if (!container.is(e.target) && container.has(e.target).length === 0 && container.length > 0) {closePopup(); } });
$('#order').on('click', function(){ $(this).toggleClass('asc desc'); a.reload(); });
$('.search').on('keypress', function(e){ if(e.which == 13) { searchEvents(window.location.pathname.indexOf('returns')); } });
$('.search_submit').on('click', function(){ searchEvents(window.location.pathname.indexOf('returns')); });
$('#logout').on('click', function(e){ e.preventDefault(); var href = $(this).attr('href'); var aktion = $(this).text(); var aktionquestion = $(this).attr('data'); confirmAction(aktion, aktionquestion, href, false); });
//$(window).scroll(function() { scrollDown(); });
$('#menu-button').on('click', function(){ $('#menu').slideToggle('fast'); });
$('body').on('click', function(e){
    var target = $(e.target);
    var target_tr = target.parent().parent().prev();
    var target_tr_menu = target_tr.find('.status_action').length;
    var target_td = target.parent().next();
    var target_td_menu = target_td.find('.status_action').length;
    var target_menu = (target.hasClass('select_menu') && window.innerWidth > 1100) ?  target_tr : target_td; console.log(target_tr.css('display'));
    if (target.hasClass('select_menu'))  { if (target_tr_menu > 0 && target_td_menu > 0) target_menu.slideToggle('fast'); }
});


function Url(host, authkey, info_url, artikel_url, file_url, img_path, local_img_path, ext_link, current_page, artikel_per_page, order, search, filter, from, to){
    this.host = host;
    this.authkey = authkey;
    this.info_url = this.host+info_url;
    this.artikel_url = this.host+artikel_url;
    this.file_url = this.host+file_url;
    this.img_path = img_path;
    this.local_img_path = local_img_path;
    this.ext_link = ext_link;
    this.current_page = current_page;
    this.artikel_per_page = artikel_per_page;
    this.order = order;
    this.search = search;
    this.filter = filter;
    this.from = from;
    this.to = to;
    this.url = function(){
        return this.artikel_url+this.authkey+'/'+this.current_page+'/'+this.artikel_per_page+'/sort=datum&order='+this.order+'&search='+this.search+'&filter='+this.filter+'&von='+this.from+'&bis='+this.to;
    }
    this.setParams = function(){
        this.order = $('#order').attr('class');
        var returns_path = window.location.pathname.indexOf('returns');
        var search_param = getUrlParam(returns_path);
        this.search = (search_param) ? search_param : $('.search').val();
        if (this.search) { $( "#datepicker-from" ).val(''); $( "#datepicker-to" ).val(''); this.from = ''; this.to = ''; }
        $('.search').val(this.search);
        this.search = $('.search').val();
        this.filter = (returns_path > 0) ? 'ret' : $('#filter option:selected').val();
        this.from = ($('#datepicker-from').val()) ? dateNumber($('#datepicker-from').val()) : '';
        this.to = ($('#datepicker-to').val()) ? dateNumber($('#datepicker-to').val()) : '';
        return this.url();
    }
}

function Customer(url){
    this.getInfo = function () {
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'json',
            cache: false,
            beforeSend: function () {
                ajaxBefore($('body'));
            },
            success: function( data, textStatus, jQxhr ){
                if(!$.isEmptyObject(data) && data[0].ERROR) { localStorageClear(); }
                var kundeninfo = data[0];
                var returns_path = window.location.pathname.indexOf('returns');
                var filter = (returns_path > 0) ? '' : getSelect(kundeninfo.Artikelfilterbezeichnung, kundeninfo.Artikelfilterwert);
                var from = new Date(kundeninfo.unixtime_von*1000);
                var to = new Date(kundeninfo.unixtime_bis*1000);
                var lang = $('html').attr('lang');
                $('#datepicker-to').after(filter);
                var keys = Object.keys(kundeninfo);
                keys.forEach(function( value, i ){
                    $('#'+value).text(kundeninfo[value]);
                });
                $('.kundeninfo-icon').attr('data', (kundeninfo.Anrede) ? kundeninfo.Anrede : 'Herr');
                getDatepicker(from, to, lang);
            },
            error: function( jqXhr, textStatus, errorThrown ){
                popup(+t.service_not_available+'!', 'error_popup');
            },
            complete: function( event, xhr, settings ){
                ajaxComplete();
                a.reload();
                $('#filter').change(function(){ searchEvents(window.location.pathname.indexOf('returns')); });
            }
        });
    }
}

function Artikel(){
    this.getInfo = function (el) {
        $.ajax({
            url: u.setParams(),
            type: 'GET',
            dataType: 'json',
            cache: false,
            beforeSend: function () {
                ajaxBefore(el);
            },
            success: function( data, textStatus, jQxhr ){
                if(!$.isEmptyObject(data) && data[0].ERROR) { localStorageClear(); }
                $('#order').css('pointer-events', 'visible');
                var html = '';
                data.forEach(function( value, index ) {
                    html += '<div class="tr menu relative">'+getAktionDropdown(value.aktion, value.aktionurl, value.aktionformat, value.aktionquestion)+'</div>';
                    html += '<div class="tr info_row">';
                    html += '<div class="td aktion relative">';
                    if (value.aktion) html += '<div class="select_menu">&#9776;</div>';
                    html += '<span class="bold artikelnummer">'+value.Artikelnummer+'</span></div>';
                    html += '<div class="td menu relative">'+getAktionDropdown(value.aktion, value.aktionurl, value.aktionformat, value.aktionquestion)+'</div>';
                    html += '<div class="td artikel_col"><div class="item"><a href="'+u.ext_link+getCleanArtikelnummer(value.Artikelnummer)+'" target=_blank><div class="item_img">'+getBild(u.img_path, value.Bild, value.Artikelbeschreibung, 'artikel_img')+'</div></a></div><div class="artikel_info"><span class="bold artikelnummer">'+value.Artikelnummer+'</span><p>'+value.Artikelbeschreibung+'</p></div></div>';
                    html += '<div class="td big groesse right"><span>'+value.Groesse+'</span></div>';
                    html += '<div class="td big price right "><span>'+value.Einzelpreis+'</span></div>';
                    html += '<div class="td auftrag"><span class="bold">'+value.Auftragsnummer+'</span> vom <span class="bold">'+value.Datum+'</span>'+getBild(u.local_img_path, value.verlaufpic, value.Status1, 'status_img')+'</div>';
                    html += '<div class="td status_col"><div class="status_col_inner">'+getBild(u.local_img_path, value.Status2pic, value.Status2, 'status_icon')+'<div class="status_div"><span class="status1">'+value.Status1+'</span>'+'<span class="status2" style="color:'+value.Status2color+'">'+value.Status2+'&nbsp;</span></div></div></div>';
                    html += '</div>';
                });
                $('#artikel').append(html);
                if ($.isEmptyObject(data)) { var more = ($('.info_row').length > 0) ?  t.more : ''; noResults(); }
            },
            complete: function( event, xhr, settings ){
                ajaxComplete();
                ($('#no_results').length > 0) ? $('#more-results').hide() : $('#more-results').show();
            },
            error: function( jqXhr, textStatus, errorThrown ){
                popup(+t.service_not_available+'!', 'error_popup');
            },
        });
    }
    this.reload = function (){
        $('.info_row').remove();
        if ($('#no_results').length > 0) { $('#no_results').remove(); }
        u.current_page = 1;
        a.getInfo($('body'));
        $('#more-results').hide();
    }
}

function noCache() {
    var links = window.document.getElementsByTagName('link');
    for (var i = 0; i < links.length; i++) {
        var href = links[i].getAttribute('href')+'?timestamp='+getRandomNumber();
        links[i].setAttribute('href', href);
    }
}

function scrollDown(){
    if ($('#no_results').length == 0) {
        if($(window).scrollTop() == $(document).height() - $(window).height()) {
            u.current_page++;
            a.getInfo($('body'));
        }
    }
}

function scrollUp(){
    (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) ? $("#myBtn").show() : $("#myBtn").hide();
}

function moreResults() {
    var no_results_length = $('#no_results').length;
    u.current_page++; a.getInfo($('.more-results'));
}

function topFunction() {
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
}

function toggle(clickel, toggleel){
    clickel.on('click', function(){ toggleel.slideToggle('fast', function(){}); });
}

function dropdownAjaxQuestion(e,el){
    e.preventDefault();
    var value = el.attr('href'); 
    var aktion = el.text(); 
    var aktionquestion = el.attr('data'); 
    confirmAction(aktion, aktionquestion, value, true);
}

function dropdownAjaxInfo(e,el){
    e.preventDefault();
    var value = el.attr('href'); 
    var aktion = el.text(); 
    ajaxAction(aktion, value, true, $('body'));
}

function searchEvents(returns_path){
    var val_length = $('.search').val().length;
    var lang = $('html').attr('lang');
    if(val_length == 0){ if (returns_path == -1) { window.history.replaceState({}, document.title, '/'+lang+'/'); } a.reload(); }
    if(val_length > 2){ a.reload();}
    if(val_length > 0 && val_length < 3) { 
        $('.search').val(''); $('.search').after('<span class="search_error">3 '+t.letters+' '+t.minimun+'!</span>'); 
        $('.search_error').delay(1000).fadeOut('slow'); 
    }
}

function dateNumber(date) {
    date_split = date.split('.');
    date = Date.parse(date_split[1]+'/'+date_split[0]+'/'+date_split[2])/1000;
    return date;
}

function getUrlParam(returns_path) {
    var search_val = $('.search').val();
    var lang = $('html').attr('lang');
    var queryString = window.location.search;
    var search = (queryString && !search_val) ? queryString.substring( queryString.indexOf('=') + 1 ) : search_val;
    if (search && returns_path == -1) { window.history.replaceState({}, document.title, '/'+lang+"/?search="+search); }
    $('.search_results').remove();
    if (search) $('.search_wrapper').before('<div class="search_results">'+t.search+' '+t.results+' '+t.for+' <b>'+search+'</b></div>');
    return search;
}

function setUrlParam(url, param){   
    window.location.href.replace(window.location.search, param);
}

function ajaxBefore(elem){
    if($('.wait').length == 0) {
    switch (elem.attr('class')) {
        case 'yes' : 
            elem.before('<div class="loading"></div>');
            break;
        case 'more-results':
            elem.html('<img src="/img/loading9.gif">');
            break;    
        default:
            if($('.overlay').length == 0) { $('body').append('<div class="overlay white"></div>'); }
            elem.append('<div class="wait"></div>');
        }
    }
}

function ajaxComplete(){
    $('.overlay').remove();
    $('.more-results').html(t.more+' '+t.results);
    $('.wait').remove();
    $('.main').show();
}

function getDatepicker(from, to, lang) {
    if (lang == 'de') {
        $( "#datepicker-from, #datepicker-to" ).datepicker({
          monthNames: [ "Januar","Februar","März","April","Mai","Juni","Juli","August","September","Oktober","November","Dezember" ], // Names of months for drop-down and formatting
          monthNamesShort: [ "Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez" ], // For formatting
          dayNames: [ "Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag" ], // For formatting
          dayNamesShort: [ "Son", "Mon", "Die", "Mit", "Don", "Fre", "Sam" ], // For formatting
          dayNamesMin: [ "So","Mo","Di","Mi","Do","Fr","Sa" ], // Column headings for days starting at Sunday
          weekHeader: "Wk", // Column header for week of the year
          firstDay: 1, // The first day of the week, Sun = 0, Mon = 1, ...
          isRTL: false, // True if right-to-left language, false if left-to-right
          showMonthAfterYear: false, // True if the year select precedes month, false for month then year
          maxDate: '0',
          dateFormat:'dd.mm.yy',
          prevText: 'Zurück',
          nextText: 'Vor',
          onSelect: function() { searchEvents(window.location.pathname.indexOf('returns')); },
        });
    } else {
       $( "#datepicker-from, #datepicker-to" ).datepicker({
           firstDay: 1,
           maxDate: '0',
           dateFormat:'dd.mm.yy',
           onSelect: function() { searchEvents(window.location.pathname.indexOf('returns')); },
       });
    }
    $( "#datepicker-from" ).datepicker().datepicker('setDate', from);
    $( "#datepicker-to" ).datepicker().datepicker('setDate', to);
}

function noResults(){
    var more = ($('.info_row').length > 0) ? t.more : ''; 
    $('#artikel').after('<div id="no_results">'+t.none+' '+more+' '+t.results+'!</div>');
}

function getCleanArtikelnummer(Artikelnummer) {
    return Artikelnummer.replace(/\./g, "");
}

function getBild(img_path, file, description, img_class){
    var img_fullpath = img_path+file;
    var onerror = "errorImage('"+img_fullpath+"?timestamp="+getRandomNumber()+"')";
    var bild = '';
    if(file) {
        bild += '<img class="'+img_class+'" src="'+img_fullpath+'?timestamp='+getRandomNumber()+'" alt="'+description+'" onerror="'+onerror+'" />';
    }
    return bild;
}

function getRandomNumber() {
    return new Date().getTime();
}

function getAktionDropdown(aktion, aktionurl, aktionformat, aktiondata) {
    var html = '';
    if(aktion && aktionurl) {
        html = '<div class="status_action"><ul>';
        var comma = aktion.indexOf(",");
        if (comma) {
            var aktion_split = aktion.split(",");
            var aktionurl_split = aktionurl.split(",");
            var aktionformat_split = aktionformat.split(",");
            var aktiondata_split = aktiondata.split(",");
            aktion_split.forEach(function( value, i ){
                html += setdropdownLinkAction(aktionformat_split[i], aktionurl_split[i], value, aktiondata_split[i]);
                i++;
            });
        } else {
            html += setdropdownLinkAction(aktionformat, aktionurl, aktion, aktiondata);
        }
        html += '</ul></div>';
    }
    return html;
}

function getSelect(filternames, filterurl) {
    var html = '';
    if (filternames && filterurl) {
        html = '<select id="filter">';
        var comma = filternames.indexOf(",");
        if (comma) {
            var filternames_split = filternames.split(",");
            var filterurl_split = filterurl.split(",");
            filternames_split.forEach(function( value, i ){
                var selected = (i === 0) ? 'selected' : '';
                html += '<option value="'+filterurl_split[i]+'" '+selected+'>'+filternames_split[i]+'</option>';
                i++;
            });
        }
        html += '</select>';
    }
    return html;
}


function setdropdownLinkAction(aktionformat, aktionurl, aktion, aktiondata){
    var html = '';
    switch (aktionformat) {
        case 'PDF':
            html += '<li><a href="'+u.host+aktionurl+'" class="dropdown-link" target="_blank">'+aktion+'</a></li>';
            break;
        case 'JSON':
            html += '<li><a href="'+u.host+aktionurl+'" class="dropdown-ajax-question" onclick="dropdownAjaxQuestion(event,$(this));" data="'+aktiondata+'">'+aktion+'</a></li>';
            break;
        case 'URL':
            html += '<li><a href="'+aktionurl+'" class="dropdown-link" target="_blank">'+aktion+'</a></li>';
            break;
        case 'JSONTAB':
            html += '<li><a href="'+u.host+aktionurl+'" class="dropdown-ajax-info" onclick="dropdownAjaxInfo(event,$(this));" data="'+aktiondata+'">'+aktion+'</a></li>';
            break;
    }
    return html;
}

function errorImage(file){
    $('[src="'+file+'"]').attr('src', u.local_img_path+'kein_bild_100_100.png');
}

function ajaxAction(aktion, url, aktioninfo, loading){
    $.ajax({
       url: url,
       type: 'POST',
       dataType: 'json',
       cache: false,
       beforeSend: function(){
           ajaxBefore(loading);
       },
       success: function( data, textStatus, jQxhr ){
           if(aktioninfo) { popup(getMultipleOrders(data), 'multi_orders'); } else { popup(data[0].success, 'success'); }
       },
        error: function( jqXhr, textStatus, errorThrown ){
            popup(+t.service_not_available+'!', 'error_popup');
        },
        complete: function(data, textStatus, jQxhr){
            $('.wait').remove();
            $('.rowspan:not(:first)').empty();
        }
    });
}

function getMultipleOrders(data){
    var html = '<div class="table"><div class="tr"><div class="td">'+t.articles+'</div><div class="td">'+t.quantity+'</div><div class="td">'+t.date+'</div><div class="td">'+t.status+'</div><div class="td">'+t.document+'</div></div>';
    data.forEach(function( value, index ) {
        html += '<div class="tr"><div class="rowspan td"><div class="item"><a href="'+u.ext_link+getCleanArtikelnummer(value.Artikelnummer)+'" target=_blank><div class="item_img">'+getBild(u.img_path, value.Bild, value.Artikelnummer, 'artikel_img')+'</div></a></div><div class="artikel_info"><span class="bold">'+value.Artikelnummer+'</span></div></div><div class="td">'+value.Menge+'</div><div class="td"><span class="bold">'+value.Datum+'</span></div><div class="td">'+value.Vorgang+'</div>';
        html += (value.BelegURL) ? '<div class="td"><a href="'+u.host+value.BelegURL+'"><img class="pdf" src="/img/pdf_download.png"></a></td>' : '<div class="td">&nbsp;</div>';
        html += '</div>';
    });
    html += '</div>';
    return html;
}


function confirmAction(aktion, aktionquestion, url, is_ajax){
    var html = aktionquestion+'<div class="buttons"><button class="yes">'+t.yes+'</button><button class="no">'+t.no+'</button></div>';
    popup(html, 'confirm');
    $('.yes').on('click', function(){ 
        if(is_ajax) { ajaxAction(aktion, url, false, $('.yes')); }
        else { if (url === 'login') { localStorageClear(); } window.location.href = url; } });
    $('.no').on('click', function(){ closePopup(); });
}

function popup(data, attr){
  var body = $('body');
  $('.popup').remove();
  $('.overlay').remove();
  body.addClass('popup_opened');
  body.append('<div class="overlay black"></div>');
  body.append('<div class="popup"><div class="inner"><div class="popup_data '+attr+'"><div class="close"></div>'+data+'</div></div></div>');
  $('.close').on('click', function(){ closePopup(); });
}

function closePopup(){
  var body = $('body');
  body.removeClass('popup_opened');
  $('.overlay').remove();
  $('.popup').remove();
}

function localStorageClear() {
   var lang = $('html').attr('lang');
   localStorage.clear();
   window.location.href = '/'+lang+'/login';
}
