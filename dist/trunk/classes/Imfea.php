<?php

namespace imfea;

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

use croox\wde;

class Imfea extends wde\Plugin {

	public function hooks(){
        parent::hooks();
		add_action( 'current_screen', array( $this, 'enqueue_script_editor' ), 10 );
	}

	public function enqueue_script_editor( $screen ){
		if ( ! is_admin() || 'post' !== $screen->base )
			return;

		$handle = $this->prefix . '_editor';

		$this->register_script( array(
			'handle'		=> $handle,
			'deps'			=> array(
				'wp-hooks',
				'wp-data',
				'wp-i18n',
				'wp-edit-post',
			),
			'in_footer'		=> true,	// default false
			'enqueue'		=> true,
			// 'localize_data'	=> array(),
		) );

	}


}