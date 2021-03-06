<?php
/*******************************************************************************
 *******************************************************************************
 ** Author: Samuel Levy <sam@samuellevy.com>
 ** 
 ** File: upgrade/versions/template.php
 ** 
 ** Description: Template for upgrade file - change 'file', 'copyright' and
 **              'author' as appropriate.
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

/*******************************************************************************
 *******************************************************************************
 ** CHANGELOG
 **
 ** - Describe changes made in version upgrade here
 *******************************************************************************
 ******************************************************************************/

// If we're not accessed in the correct way, die
if (defined('CONFIGURED')) {
    // Set the version number
    $VERSION = 'version_number';
    
    /*
     Do any database upgrades required here
    */
    
    // Do not change this line - it's what tells the system that the upgrade is complete
    Settings::set('MICO_VERSION',$VERSION);
} else {
    die ("No direct access allowed");
}