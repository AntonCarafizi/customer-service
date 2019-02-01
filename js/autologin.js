var host = 'https://kcws.spohr.eu';

(function(){
  $('#year').text((new Date).getFullYear());
  ajaxBefore($('body'));
  submit();
})();

function getUrlParam(key)
{
   var query = window.location.search.substring(1);
   var vars = query.split("&");
   var value = '';
   for (var i=0;i<vars.length;i++) {
           var pair = vars[i].split("=");
           if(pair[0] == key){value = pair[1];}
   }
   return value;
}

function ajaxBefore(elem){
    if($('.overlay').length == 0) { $('body').append('<div class="overlay white"></div>'); }
    if($('.wait').length == 0) {
    switch (elem.attr('class')) {
        case 'yes' : 
            elem.before('<div class="loading"></div>');
            break;
        default:
            elem.append('<div class="wait"></div>');
        }
    }
}

function ajaxComplete(){
    $('.overlay').remove();
    $('.wait').remove();
    $('.main').show();
}

function popup(data, attr){
  var body = $('body');
  $('.popup').remove();
  $('.overlay').remove();
  body.addClass('popup_opened');
  if($('.overlay').length == 0) body.append('<div class="overlay black"></div>');
  body.append('<div class="popup"><div class="inner"><div class="popup_data '+attr+'"><div class="close"></div>'+data+'</div></div></div>');
  $('.close').on('click', function(){ closePopup(); });
}

function closePopup(){
  var body = $('body');
  body.removeClass('popup_opened');
  $('.overlay').remove();
  $('.popup').remove();
}

function submit(){
    var url = (getUrlParam('sessionId')) ? host+'/kc_get_authkey_by_sid/' : host+'/kc_get_authkey/';
    var email = getUrlParam('email');
    var password = getUrlParam('einmalCode');
    var sessionId = getUrlParam('sessionId');
    var number = getUrlParam('number');
    var page = getUrlParam('page');
    url = (getUrlParam('sessionId')) ? url+number+'/'+sessionId : url+email+'/'+password;
    $.ajax({
        url: url,
        dataType: 'json',
        type: 'POST',
        success: function( data, textStatus, jQxhr )
        {
            var authkey = data[0].authkey;
            localStorage.setItem('authkey', authkey);
            window.location.href = (page) ?  '/'+page : '/';
        },
        error: function( jqXhr, textStatus, errorThrown ){
            email = '';
            password = '';
            url = '';
        }
    });
}
