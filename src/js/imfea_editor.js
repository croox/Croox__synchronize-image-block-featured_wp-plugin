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
const { useSelect, useDispatch } = wp.data;
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

/**
 * Image BlockEdit Container Component
 *
 * Takes original BlockEdit as prop.
 *
 * Adds inspector panel with toggle control.
 * Updates block attributes if post featured changes.
 * Updates post featured image if block attributes image change.
 */
const ImageSyncBlockEdit = ( {
    BlockEdit,
    ...props
} ) => {

	const {
		attributes: {
			imfeaShouldSync,
			imfeaShouldSyncLock,
			id,
			url,
			linkDestination,
		},
        setAttributes,
    } = props;

    const { editPost } = useDispatch( 'core/editor' );
    const { createErrorNotice } = useDispatch( 'core/notices' );

    const {
        currentPostTypeObj,
        featuredMediaId,
        featuredMedia,
    } = useSelect( ( select ) => {
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
        const featuredMediaId = getEditedPostAttribute( 'featured_media' );

		return {
            currentPostTypeObj: Array.isArray( postTypes ) ? [...postTypes].find( type => currentPostType === type.slug ) : null,
            featuredMediaId,
            featuredMedia: featuredMediaId ? getMedia( featuredMediaId ) : null,
        };
    }, [] );

	// Update block image from featured image.
	// if not locked || ...
	useEffect( () => {
        if ( imfeaShouldSyncLock
			|| ! imfeaShouldSync
            || ! featuredMediaId
            || ! currentPostTypeObj || ! currentPostTypeObj.supports.thumbnail
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

    if ( ( ! currentPostTypeObj || ! currentPostTypeObj.supports.thumbnail )
        || ( url && url.startsWith( 'https://s.w.org/images/core' ) )
    ) {
		return <BlockEdit {...props}/>;
	}

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
};

/**
 * Filter BlockEdit, use Container Component if core/image
 */
addFilter( 'editor.BlockEdit', 'imfea.BlockEdit', createHigherOrderComponent( BlockEdit => props => 'core/image' === props.name
    ? <ImageSyncBlockEdit {...{ ...props, BlockEdit }}/>
    : <BlockEdit {...props}/>
) );
