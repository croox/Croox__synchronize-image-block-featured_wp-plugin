<?php
/*
	Plugin Name: Croox Synchronize image block with featured image
	Plugin URI: https://github.com/croox/Croox__synchronize-image-block-featured_wp-plugin
	Description: Add option to synchronize the core/image block with the post featured image.
	Version: 0.0.2
	Author: croox
	Author URI: https://github.com/croox
	License: GNU General Public License v2 or later
	License URI: http://www.gnu.org/licenses/gpl-2.0.html
	Text Domain: imfea
	Domain Path: /languages
	Tags: image,block,featured,sync,synchronize
	GitHub Plugin URI: https://github.com/croox/Croox__synchronize-image-block-featured_wp-plugin
	Release Asset: true
*/
?><?php
/**
 * Synchronize Image Block With Featured Image Plugin init
 *
 * @package Croox__synchronize-image-block-featured_wp-plugin
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

include_once( dirname( __FILE__ ) . '/vendor/autoload.php' );

function imfea_init() {

	$init_args = array(
		'version'		=> '0.0.2',
		'slug'			=> 'Croox__synchronize-image-block-featured_wp-plugin',
		'name'			=> 'Croox Synchronize image block with featured image',
		'prefix'		=> 'imfea',
		'textdomain'	=> 'imfea',
		'project_kind'	=> 'plugin',
		'FILE_CONST'	=> __FILE__,
		'db_version'	=> 0,
		'wde'			=> array(
			'generator-wp-dev-env'	=> '0.16.1',
			'wp-dev-env-grunt'		=> '0.11.1',
			'wp-dev-env-frame'		=> '0.11.0',
		),
		'deps'			=> array(
			'php_version'	=> '5.6.0',		// required php version
			'wp_version'	=> '5.0.0',			// required wp version
			'plugins'    	=> array(
				/*
				'woocommerce' => array(
					'name'              => 'WooCommerce',               // full name
					'link'              => 'https://woocommerce.com/',  // link
					'ver_at_least'      => '3.0.0',                     // min version of required plugin
					'ver_tested_up_to'  => '3.2.1',                     // tested with required plugin up to
					'class'             => 'WooCommerce',               // test by class
					//'function'        => 'WooCommerce',               // test by function
				),
				*/
			),
			'php_ext'     => array(
				/*
				'xml' => array(
					'name'              => 'Xml',                                           // full name
					'link'              => 'http://php.net/manual/en/xml.installation.php', // link
				),
				*/
			),
		),
	);

	// see ./classes/Imfea.php
	return imfea\Imfea::get_instance( $init_args );
}
imfea_init();

?>