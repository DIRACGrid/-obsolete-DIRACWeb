# -*- coding: utf-8 -*-
<%inherit file="/base.mako" />

<%def name="head_tags()">
</%def>
<p class='error'>${ c.error }</p>

%if c.link:
<a href='${c.link[0]}'>${c.link[1]}</a>
%endif
