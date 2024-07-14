<?php
/**
 * Plugin Name:       Attribute Commander
 * Description:       Example block scaffolded with Create Block tool.
 * Requires at least: 6.1
 * Requires PHP:      7.0
 * Version:           0.1.0
 * Author:            The WordPress Contributors
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       attribute-commander
 *
 * @package CreateBlock
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly.
}

add_action( 'wp_loaded', 'attribute_commander_register_assets' );
add_action( 'enqueue_block_editor_assets', 'attribute_commander_block_editor_assets' );

function attribute_commander_register_assets() {
	if ( file_exists( __DIR__ . '/build/editor.asset.php' ) ) {
		$asset = require __DIR__ . '/build/editor.asset.php';
		wp_register_script( 'attribute-commander-editor', plugins_url( '/build/editor.js', __FILE__ ), $asset['dependencies'], $asset['version'] );
	}
}

function attribute_commander_block_editor_assets() {
	wp_enqueue_script( 'attribute-commander-editor' );
}

add_filter( 'render_block', 'attribute_commander_inject_attributes', 10, 2 );

function attribute_commander_inject_attributes( $block_content, $parsed_block ) {
	if ( empty( $parsed_block['attrs']['attributesMap'] ) ) {
		return $block_content;
	}

	$tags = new WP_HTML_Tag_Processor( $block_content );

	if ( ! empty( $parsed_block['attrs']['attributesMap']['@'] ) ) {
		$tags->next_tag();
		foreach ( $parsed_block['attrs']['attributesMap']['@'] as $key => $value ) {
			$tags->set_attribute( $key, $value );
		}
	}

	foreach ( $parsed_block['attrs']['attributesMap'] as $locator => $directives ) {
		if( $tags->next_tag( $locator ) ) {
			foreach ( $directives as $key => $value ) {
			$tags->set_attribute( $key, $value );
			}
		}
	}
	return $tags->get_updated_html();
}
