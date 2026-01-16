import type { Document, Transform } from '@gltf-transform/core';
import { KHRDracoMeshCompression } from '@gltf-transform/extensions';
import { assignDefaults, createTransform } from './utils.js';
import { weld } from './weld.js';

const NAME = 'draco';

export interface DracoOptions {
	method?: 'edgebreaker' | 'sequential';
	encodeSpeed?: number;
	decodeSpeed?: number;
	quantizePosition?: number;
	quantizeNormal?: number;
	quantizeColor?: number;
	quantizeTexcoord?: number;
	quantizeGeneric?: number;
	quantizationVolume?: 'mesh' | 'scene';
	/**
	 * Minimum vertex count for Draco compression. Primitives with fewer vertices
	 * than this threshold will be skipped. Default: 0 (compress all primitives).
	 * Tiny meshes often have poor compression ratios and may benefit from being
	 * left uncompressed.
	 */
	minVertexCount?: number;
}

export const DRACO_DEFAULTS: Required<DracoOptions> = {
	method: 'edgebreaker',
	encodeSpeed: 5,
	decodeSpeed: 5,
	quantizePosition: 14,
	quantizeNormal: 10,
	quantizeColor: 8,
	quantizeTexcoord: 12,
	quantizeGeneric: 12,
	quantizationVolume: 'mesh',
	minVertexCount: 0,
};

/**
 * Applies Draco compression using {@link KHRDracoMeshCompression KHR_draco_mesh_compression}.
 * Draco compression can reduce the size of triangle geometry.
 *
 * This function is a thin wrapper around the {@link KHRDracoMeshCompression} extension.
 *
 * ### Example
 *
 * ```typescript
 * import { NodeIO } from '@gltf-transform/core';
 * import { KHRDracoMeshCompression } from '@gltf-transform/extensions';
 * import { draco } from '@gltf-transform/functions';
 * import draco3d from 'draco3dgltf';
 *
 * const io = new NodeIO()
 * 	.registerExtensions([KHRDracoMeshCompression])
 * 	.registerDependencies({
 * 		'draco3d.encoder': await draco3d.createEncoderModule()
 * 	});
 *
 * await document.transform(
 *   draco({method: 'edgebreaker'})
 * );
 *
 * await io.write('compressed.glb', document);
 * ```
 *
 * Compression is deferred until generating output with an I/O class.
 *
 * @category Transforms
 */
export function draco(_options: DracoOptions = DRACO_DEFAULTS): Transform {
	const options = assignDefaults(DRACO_DEFAULTS, _options);

	return createTransform(NAME, async (document: Document): Promise<void> => {
		await document.transform(weld());
		document
			.createExtension(KHRDracoMeshCompression)
			.setRequired(true)
			.setEncoderOptions({
				method:
					options.method === 'edgebreaker'
						? KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER
						: KHRDracoMeshCompression.EncoderMethod.SEQUENTIAL,
				encodeSpeed: options.encodeSpeed,
				decodeSpeed: options.decodeSpeed,
				quantizationBits: {
					POSITION: options.quantizePosition,
					NORMAL: options.quantizeNormal,
					COLOR: options.quantizeColor,
					TEX_COORD: options.quantizeTexcoord,
					GENERIC: options.quantizeGeneric,
				},
				quantizationVolume: options.quantizationVolume,
				minVertexCount: options.minVertexCount,
			});
	});
}
