/**
 * External dependencies
 */
import { get, pick } from 'lodash';

/**
 * WordPress dependencies
 */
// const { Component } = wp.element;
const { __ } = wp.i18n;
const { addFilter } = wp.hooks;
const { createHigherOrderComponent } = wp.compose;
const { withSelect, withDispatch } = wp.data;
const { compose } = wp.compose;
const { InspectorControls } = wp.editor;
const { useEffect } = wp.element;
const { PanelBody, ToggleControl } = wp.components;





/**
 * Add Block attributes to image block.
 */
addFilter( 'blocks.registerBlockType', 'imfea.addBlockAttributes', ( settings, name ) => name === 'core/image' ? {
	...settings,
	attributes: {
		...settings.attributes,
		imfeaShouldSync: {
			type: 'boolean',
			default: false,
		},
		imfeaShouldSyncLock: {
			type: 'boolean',
			default: false,
		},
	},
} : settings );

addFilter( 'editor.BlockEdit', 'imfea.BlockEdit.test', createHigherOrderComponent( BlockEdit => compose( [
	withSelect( ( select ) => {
		const {
			getEditedPostAttribute,
			getCurrentPostType,
		} = select( 'core/editor');
		const {
			getPostTypes,
			getMedia,
		} = select( 'core');
		const postTypes = getPostTypes();
		const currentPostType = getCurrentPostType();
		const currentPostTypeObj = Array.isArray( postTypes ) ? [...postTypes].find( type => currentPostType === type.slug ) : null;
		const featuredMediaId = getEditedPostAttribute( 'featured_media' );
		return {
			featuredMediaId,
			featuredMedia: featuredMediaId ? getMedia( featuredMediaId ) : null,
			supportsFeatured: currentPostTypeObj ? currentPostTypeObj.supports.thumbnail : false,
		 };
	} ),
	withDispatch( ( dispatch ) => {
		const { editPost } = dispatch( 'core/editor' );
		const { createErrorNotice } = dispatch( 'core/notices' );
		return {
			editPost,
			createErrorNotice,
		};
	} ),
] )( props => {

	const {
		name,
		attributes: {
			imfeaShouldSync,
			imfeaShouldSyncLock,
			id,
			url,
			linkDestination,
		},
		setAttributes,
		editPost,
		featuredMediaId,
		featuredMedia,
		supportsFeatured,
		createErrorNotice,
    } = props;

    const isImageBlock = () => name === 'core/image'		// Make sure only affects image block
        && ! url.startsWith( 'https://s.w.org/images/core' ) 	// Get out if block is just a block style control
        && supportsFeatured								// Get out if postType doesn't support featured image

	// Update block image from featured image.
	// if not locked || ...
	useEffect( () => {
        if ( ! isImageBlock()
            || imfeaShouldSyncLock
			|| ! imfeaShouldSync
			|| ! featuredMediaId
			|| id === featuredMediaId
			|| 0 == featuredMediaId
			|| ! featuredMedia
		) {
			return;
		}

		let mediaAttributes = pick( featuredMedia, ['id', 'link', 'caption' ] );
		mediaAttributes.alt = featuredMedia.alt_text,
		mediaAttributes.url =
			get( featuredMedia, [ 'sizes', 'large', 'url' ] ) ||
			get( featuredMedia, [ 'media_details', 'sizes', 'large', 'source_url' ] ) ||
			featuredMedia.url;

		// Check if the image is linked to it's media.
		if ( linkDestination === 'media' && featuredMedia.url ) {
			// Update the media link.
			mediaAttributes.href = featuredMedia.url;
		}

		// Check if the image is linked to the attachment page.
		if ( linkDestination === 'attachment' ) {
			// Update the media link.
			mediaAttributes.href = featuredMedia.link;
		}

		setAttributes( {
			...mediaAttributes,
			width: undefined,
			height: undefined,
			sizeSlug: 'large',
		} );
    } );

	if ( ! isImageBlock() ) {
		return <BlockEdit {...props}/>;
	}
    console.log('debug ???: props', isImageBlock(), props);


	/**
	 * Overwrite setAttributes
	 *
	 * - On imageChange interrupt, if image is url.
	 * - On imageChange updates the post featured image.
	 */
	const setAttributesFeaturedSync = newAttributes => {
		// Just set attributes if disabled sync
		const shouldSync = newAttributes.imfeaShouldSync ? newAttributes.imfeaShouldSync : imfeaShouldSync;
		if ( ! shouldSync )
			return setAttributes( newAttributes ) ;

		// Just set attributes if block image did not change
		const isImageChange = id !== newAttributes.id;
		if ( ! isImageChange )
			return setAttributes( newAttributes ) ;

		// Interrupt if image is url and not local media
		if ( undefined == newAttributes.id ) {
			return createErrorNotice(
				__( 'Image block is synchronized with featured image. Impossible to use an external URL as image source.', 'imfea' ),
				{
					id: 'image-sync-can-not-set-url',
					type: 'snackbar',
				}
			);
		}

		// Set attributes
		// and disable that the block receives featured image for a moment.
		setAttributes( {
			...newAttributes,
			...( newAttributes.id !== featuredMediaId && { imfeaShouldSyncLock: true } ),
		} );
		// Update post featured_media and then enable that the block receives featured image again.
		if ( newAttributes.id !== featuredMediaId ) {
			editPost( { featured_media: newAttributes.id } ).then( () => setAttributes( {
				imfeaShouldSyncLock: false,
			} ) );
		}
	};

	return <>
		<InspectorControls>
			<PanelBody
				title={ __( 'Synchronize with Featured image', 'imfea' ) }
				initialOpen="true"
			>
				<ToggleControl
					label={ __( 'Synchronize with Featured image', 'imfea' ) }
					checked={ imfeaShouldSync }
					help={ imfeaShouldSync
						? __( 'This Image Block is synchronized with the featured image. They update each other.', 'imfea' )
						: id === featuredMediaId
							? __( 'This Image Block is not synchronized with the featured image. But by chance they are the same.', 'imfea' )
							: featuredMediaId && 0 != featuredMediaId
								? __( 'This Image Block is not synchronized with the featured image. On synchronize, this block will receive the featured image.', 'imfea' )
								: __( 'This Image Block is not synchronized with the featured image. No featured image is set. On synchronize, the featured image will receive this block image.', 'imfea' )
					}
					onChange={ () => setAttributes( { imfeaShouldSync: ! imfeaShouldSync } ) }
				/>
			</PanelBody>
		</InspectorControls>

		<BlockEdit {...{
			...props,
			setAttributes: setAttributesFeaturedSync,
		}}/>
	</>;
} ), "withInnerBlocksIds" ) );
