<?php
/*******************************************************************************
 *******************************************************************************
 ** Author: Samuel Levy <sam@samuellevy.com>
 ** 
 ** File: api.php
 ** 
 ** Description: Calls API functions
 **
 ** Copyright (c) 2012 Samuel Levy
 ** 
 ** Mico is free software: you can redistribute it and/or
 ** modify it under the terms of the GNU Lesser General Public License as
 ** published by the Free Software Foundation, either version 3 of the License,
 ** or (at your option) any later version.
 **
 ** This program is distributed in the hope that it will be useful, but WITHOUT
 ** ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 ** FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Lesser General Public License
 ** for more details.
 **
 ** You should have received a copy of the GNU Lesser General Public License
 *******************************************************************************
 ******************************************************************************/
// include the configuration file
include_once ('inc/config.php');
// Connect to the database, and brings in the standard library
include_once(FS_ROOT.'/inc/connect.php');

// Set up the Language system
$LANG = new Lang(Settings::get_default('LANGUAGE','EN'));

$data = false;

// Set the starting values
$error = false;
$error_message = '';

$user = false;
$session_expired = false;

// check if the user is logged in or not
if (isset($_POST['session'])) {
    try {
        $user = User::by_session($_POST['session']);
        
        // Update the language file to the user's preference
        $LANG->set_language($user->get_var_default('lang',''));
    } catch (UserSessionException $e) {
        // error while authenticating off the session
        $error = true;
        $error_message = $e->getMessage();
        $user = false;
        $session_expired = true;
    }
}

// If there's no errors, get the right file
if (!$error) {
    // check if we have a logged in user
    if ($user) {
        
        // Check that the requested file exists
        if ($user->get_role()=='admin' && api_exists ("api-admin",$_GET ["f"])) {
            // admin apis can override normal and manager apis, but only users with admin access can hit them
            require_once ("api-admin/".$_GET ["f"].".php");
        } else if (($user->get_role()=='admin' || $user->get_role()=='manager') && api_exists ("api-manager",$_GET ["f"])) {
            // manager apis can override normal apis, but only users with admin or manager access can hit them
            require_once ("api-manager/".$_GET ["f"].".php");
        } else if (api_exists ("api",$_GET ["f"])) {
            // regular API
            require_once ("api/".$_GET ["f"].".php");
        } else {
            $error = true;
            $error_message = $LANG->get_string('api/Unknownfunction');
        }
    } else {
        // we can only check the public API
        if (api_exists ("api-public",$_GET ["f"])) {
            // Include the remote API file for processing
            require_once ("api-public/".$_GET ["f"].".php");
        } else {
            $error = true;
            $error_message = $LANG->get_string('api/Unknownfunction');
        }
    }
}

// check if the API returned a '$data' object
if (!$error && $data === false) {
    $error = true;
    $error_message = $LANG->get_string('api/APIError');
}

// Were there any errors?
if ($error) {
    $data = array ("success" => false, "info" => $error_message);
} // if ()

// notify the user that their session has expired
if ($session_expired) {
    $data['sessionexpired'] = $session_expired;
}

// Return the data value
header ("Content-Type: text/javascript");
echo json_encode ($data);