# -*- coding: utf-8 -*-
<%inherit file="/base.mako" />

<%def name="head_tags()">
${ h.stylesheet_link_tag( "/yui/calendar/assets/skins/sam/calendar.css" ) }
${ h.javascript_include_tag( "/yui/calendar/calendar-min.js" ) }
<script type="text/javascript">
  var acCalendar;
  var acSelectedEdit;
  function initCalendars() {
    acCalendar = new YAHOO.widget.Calendar( "calHTMLID","calDisplay", { close : true , title : "Select date" } ); 
    acCalendar.render();
    acCalendar.hide();
  }
  function handleCalSelect( type, args, obj ) {
		var dates = args[0];
		var date = dates[0];
		var year = date[0], month = date[1], day = date[2];
		acSelectedEdit.value = day + "/" + month + "/" + year;
		acCalendar.hide();
	}
  function showCalendar( edSelector ) {
    acSelectedEdit = document.getElementById( edSelector );
    acCalendar.show();
    calObj = acCalendar.oDomContainer;
    YAHOO.util.Dom.setX( calObj, YAHOO.util.Dom.getX( acSelectedEdit ) );
    YAHOO.util.Dom.setY( calObj, YAHOO.util.Dom.getY( acSelectedEdit ) );
  	acCalendar.selectEvent.subscribe( handleCalSelect, acCalendar, true );
  }
  YAHOO.util.Event.onContentReady( 'dateSelection', initCalendars );
</script>
<style>
#calDisplay { display:none; position:absolute; left:10px; top:300px; z-index:1 } 
table#dateSelection { border : 0px; margin: auto;}
table#dateSelection td{ text-align : center; padding : 5px 5px 5px 	px;}
</style>
</%def>

<%def name="calendarAnchor()">
  <table id='dateSelection'>
   <tr>
    <td><a href='#' onclick='javascript:showCalendar("fromDate")'>From</a></td>
    <td><input type='text' name='fromDate' id='fromDate'/></td>
   </tr>
   <tr>
    <td><a href='#' onclick='javascript:showCalendar("toDate")'>To</a></td>
    <td><input type='text' name='toDate' id='toDate'/></td>
   </tr>
  </table>
  <div id='calDisplay'></div>
</%def>

