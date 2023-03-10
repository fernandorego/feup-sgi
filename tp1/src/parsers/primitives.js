import { MyRectangle } from "../assets/primitives/MyRectangle.js";
import { MySphere } from "../assets/primitives/MySphere.js";
import { MyTorus } from "../assets/primitives/MyTorus.js";
import { MyTriangle } from "../assets/primitives/MyTriangle.js";
import { MyCylinder } from "../assets/primitives/MyCylinder.js";

/**
 * Parses the <primitives> block.
 * @param {MySceneGraph} sceneGraph - Reference to MySceneGraph object
 * @param {primitives block element} primitivesNode - primitives block element
 */
export function parsePrimitives(sceneGraph, primitivesNode) {
    const children = primitivesNode.children;
    sceneGraph.primitives = [];
    let grandChildren = [];

    // Any number of primitives.
    for (let i = 0; i < children.length; i++) {
        if (children[i].nodeName != 'primitive') {
            sceneGraph.onXMLMinorError('unknown tag <' + children[i].nodeName + '>');
            continue;
        }

        // Get id of the current primitive.
        const primitiveId = sceneGraph.reader.getString(children[i], 'id');
        if (primitiveId == null) return 'no ID defined for texture';

        // Checks for repeated IDs.
        if (sceneGraph.primitives[primitiveId] != null)
            return 'ID must be unique for each primitive (conflict: ID = ' +
                primitiveId + ')';

        grandChildren = children[i].children;

        // Validate the primitive type
        if (grandChildren.length != 1 ||
            (grandChildren[0].nodeName != 'rectangle' &&
                grandChildren[0].nodeName != 'triangle' &&
                grandChildren[0].nodeName != 'cylinder' &&
                grandChildren[0].nodeName != 'sphere' &&
                grandChildren[0].nodeName != 'torus')) {
            return 'There must be exactly 1 primitive type (rectangle, triangle, cylinder, sphere or torus)'
        }

        // Specifications for the current primitive.
        const primitiveType = grandChildren[0].nodeName;

        // Retrieves the primitive coordinates.
        if (primitiveType == 'rectangle') {
            const [x1, y1, x2, y2] = sceneGraph.parseFloatProps(grandChildren[0],
                'rectangle for ID ' + primitiveId, ['x1', 'y1', 'x2', 'y2']);
            const rect = new MyRectangle(sceneGraph.scene, primitiveId, x1, x2, y1, y2);
            sceneGraph.primitives[primitiveId] = rect;
        } else if (primitiveType == 'triangle') {
            const [x1, y1, z1, x2, y2, z2, x3, y3, z3] = sceneGraph.parseFloatProps(grandChildren[0],
                'triangle coordinates for ID ' + primitiveId, ['x1', 'y1', 'z1', 'x2', 'y2', 'z2', 'x3', 'y3', 'z3']);
            const triangle = new MyTriangle(sceneGraph.scene, primitiveId, x1, y1, z1, x2, y2, z2, x3, y3, z3);
            sceneGraph.primitives[primitiveId] = triangle;
        } else if (primitiveType == 'cylinder') {
            const [base, top, height, slices, stacks] = sceneGraph.parseFloatProps(grandChildren[0],
                'cylinder coordinates for ID ' + primitiveId, ['base', 'top', 'height', 'slices', 'stacks']);
            const cylinder = new MyCylinder(sceneGraph.scene, primitiveId, base, top, height, slices, stacks);
            sceneGraph.primitives[primitiveId] = cylinder;
        } else if (primitiveType == 'sphere') {
            const [radius, slices, stacks] = sceneGraph.parseFloatProps(grandChildren[0],
                'sphere coordinates for ID ' + primitiveId, ['radius', 'slices', 'stacks']);
            const sphere = new MySphere(sceneGraph.scene, primitiveId, radius, slices, stacks);
            sceneGraph.primitives[primitiveId] = sphere;
        } else {
            const [inner, outer, slices, loops] = sceneGraph.parseFloatProps(grandChildren[0],
                'torus coordinates for ID ' + primitiveId, ['inner', 'outer', 'slices', 'loops']);
            const torus = new MyTorus(sceneGraph.scene, primitiveId, inner, outer, slices, loops);
            sceneGraph.primitives[primitiveId] = torus;
        }
    }

    console.log('Parsed primitives');
    return null;
}
