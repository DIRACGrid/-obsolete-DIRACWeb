# -*- coding: utf-8 -*-
<html>
 <head>
  <title>CS Diff</title>
  <style>
  table {
  	width : 100%;
  	margin : 0px;
		font-size : small;
		text-align : left;
    border-collapse: collapse;
  }
  th {
		font-weight : bold;
    border : 0px;
  }
  td {
  	font-size : x-small;
  }
  tr.add {
  	background-color : #AFA;
  }
  tr.del {
  	background-color : #FAA;
  }
  tr.mod {
  	background-color : #FFA;
  }
  tr.conflict {
  	background-color : #FFA;
  }
  </style>
 </head>
 <body>
  <table>
   <tr>
    <th>${c.titles[0]}</th><th>${c.titles[1]}</th>
   </tr>
%for line in c.diffList:
	<tr class='${line[0]}'>
    <td>${line[1].replace( " ", "&nbsp;" )}</td><td>${line[2].replace( " ", "&nbsp;" )}</td>
   </tr>
%endfor
 </body>
</html>
