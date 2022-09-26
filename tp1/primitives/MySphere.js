import { CGFobject } from '../../lib/CGF.js';
import { normalizeVector } from '../utils/math.js';

/**
 * MySphere
 * @constructor
 * @param scene - Reference to MyScene object
 * @param radius - Radius of the sphere
 * @param slices - Number of slices (divisions around axis)
 * @param stacks - Number of stacks (divisions between poles)
 */
export class MySphere extends CGFobject {
    constructor(scene, id, radius, slices, stacks) {
        super(scene);
        this.radius = radius;
        this.slices = slices;
        this.stacks = stacks;

        this.initBuffers();
    }

    initBuffers() {
        this.vertices = [];
        this.indices = [];
        this.normals = [];

        const deltaTheta = 2 * Math.PI / this.slices;
        const deltaBeta = Math.PI / this.stacks;

        // Vertices
        let beta = 0;
        for (let i = 0; i <= this.stacks; i++) {
            let theta = 0;
            const z = Math.cos(beta) * this.radius;
            const xyCof = Math.sin(beta) * this.radius;
            for (let j = 0; j <= this.slices; j++) {
                const vertex = [Math.cos(theta) * xyCof, Math.sin(theta) * xyCof, z];
                this.vertices.push(...vertex);
                this.normals.push(...normalizeVector(vertex));
                theta += deltaTheta;
            }
            beta += deltaBeta;
        }

        // Indices
        for (let i = 0; i <= this.stacks; i++) {
            for (let j = 0; j < this.slices; j++) {
                const first = (i * this.slices) + j;
                const second = first + 1;
                const third = first + this.slices + 1;
                const fourth = third + 1;
                this.indices.push(third, second, first);
                if (j !== this.slices - 1 || i < this.stacks - 1) {
                    this.indices.push(third, fourth, second);
                }
            }
        }

        this.primitiveType = this.scene.gl.TRIANGLES;
        this.initGLBuffers();
    }

    /**
     * @method updateTexCoords
     * Updates the list of texture coordinates of the sphere
     * @param {Array} coords - Array of texture coordinates
     */
    updateTexCoords(coords) {
        this.texCoords = [...coords];
        this.updateTexCoordsGLBuffers();
    }
}
