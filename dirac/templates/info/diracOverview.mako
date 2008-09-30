# -*- coding: utf-8 -*-
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<%inherit file="/diracPage.mako" />

<%def name="head_tags()">
${ h.javascript_include_tag( "/javascripts/htmlPage.js" ) }
<style type="text/css">
<!--
.tmp{
  color: #3f3f3c;
  font-family: 'HoeflerText-Regular', 'Hoefler Text', 'Times New Roman', serif;
  font-size: 14px !important;
  font-style: normal;
  font-variant: normal;
  font-weight: normal;
  letter-spacing: 0;
  line-height: 16px;
  margin-bottom: 0px;
  margin-left: 7px;
  margin-right: 36px;
  margin-top: 0px;
  opacity: 1.00;
  padding-bottom: 10px;
  padding-top: 0px;
  text-align: justify;
  text-decoration: none;
  text-indent: 0px;
  text-transform: none;
}
-->
</style>
</%def>

<%def name="body()">
<script type="text/javascript">
  initHTML( 'mainBody' );
</script>

<div id='mainBody' class="tmp">
<table width="800" border="0" cellspacing="5" align="center">
  <tr>
    <td width="400" align="center"><img src=${ h.url_for( "/images/content/overview1.png" )}></td>
    <td width="400">
    	<p>The DIRAC (<b>D</b>istributed <b>I</b>nfrastructure with <b>R</b>emote <b>A</b>gent <b>C</b>ontrol)  project is a complete Grid solution for a community of users such as  the LHCb Collaboration. DIRAC forms a layer between a particular  community and various compute resources to allow optimized, transparent  and reliable usage.</p>
	</td>
  </tr>
  <tr>
    <td>
      <p>DIRAC  forms a layer between a particular community and various compute  resources to allow optimized, transparent and reliable usage.</p>
      <p>The  DIRAC architecture consists of numerous cooperating Distributed  Services and Light Agents built within the same DISET framework following the Grid security standards.</p>
		  </td>
    <td align="center"><img src=${ h.url_for( "/images/content/overview2.png" )}></td>
  </tr>
  <tr>
    <td align="center"><img src=${ h.url_for( "/images/content/overview3.png" )}></td>
    <td><p>DIRAC  introduced the now widely used concept of Pilot Agents. This allows  efficient Workload Management Systems (WMS) to be built. The workload  of the community is optimized in the central Task Queue.</p>
      <p>The WMS is carefully designed to be resilient to failures in the ever changing Grid environment.</p></td>
  </tr>
  <tr>
    <td><p>The  DIRAC project includes a versatile Data Management System (DMS) which  is optimized for reliable data transfers. The DMS automates the routine  data distribution tasks.</p>
    <p>The  DIRAC Production Management System is built on top of the Workload and  Data Management services. This provides automated data driven  submission of processing jobs with workflows of arbitrary complexity</p>
    <p>The DIRAC Project has all the necessary components to build Workload and  Data management systems of varying complexity. It offers a complete  and powerful Grid solution for other user grid communities.</p>
</td>
    <td align="center"><img src=${ h.url_for( "/images/content/overview4.png" )}></td>
  </tr>
</table>


</%def>
