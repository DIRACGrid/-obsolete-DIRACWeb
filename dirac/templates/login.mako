# -*- coding: utf-8 -*-
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<%inherit file="/diracPage.mako" />

<%def name="head_tags()">
${ h.javascript_include_tag( "/javascripts/htmlPage.js" ) }
</%def>

<%def name="body()">
<script type="text/javascript">
  initHTML( 'mainBody' );
</script>

<div id='mainBody'>
</div>

<script type="text/javascript">
  var res = 'Please, login using your certificate';
  if(pageDescription){
    if(pageDescription.userData){
      if(pageDescription.userData.username == 'Anonymous'){
        if(pageDescription.userData.DN){
          res = 'To access your jobs please use the ' + pageDescription.userData.DN;
        }
      }
    }
  }
  var div = document.getElementById('mainBody');
  res = res + '<br>If you have questions concerning your browser and the certificate, please go '
  res = res + '<a href="https://twiki.cern.ch/twiki/bin/view/LHCb/FAQ/Certificate">here</a>'
  div.innerHTML = '<p style="text-align:center;margin-top:50px">' + res + '</p>';
</script>

</%def>
