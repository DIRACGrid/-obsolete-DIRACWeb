# -*- coding: utf-8 -*-
<%inherit file="/base.mako" />

<%def name="head_tags()">
<style>
</style>
</%def>

<h2> Upload a configuration file to modify </h2>

${ h.form( h.url( action = 'doUploadConfig' ), multipart=True ) }
Upload file:      ${h.file_field('cfgFile')} <br />
                  ${h.submit('Submit')}
${h.end_form()}

