﻿/**
 * Code Verification - Ensure Overload Structures Match.
 * -----------------------------------------------------
 * When a developer adds another interface to a structure like MethodDeclaration (ex. ScopableNodeStructure),
 * then we need to ensure that same structure was also added to MethodOverloadDeclaration.
 *
 * This code verification ensures that an overload structure matches its "implementation" structure.
 * -----------------------------------------------------
 */
import { Structure, TsSimpleAstInspector } from "../inspectors";
import { Problem } from "./Problem";

export function ensureOverloadStructuresMatch(inspector: TsSimpleAstInspector, addProblem: (problem: Problem) => void) {
    // get structures
    const structures = inspector.getStructures();
    const overloadStructures = inspector.getOverloadStructures();

    // find the problems
    for (const overloadStructure of overloadStructures) {
        const structureName = overloadStructure.getName().replace("Overload", "");
        const structure = structures.find(s => s.getName() === structureName);

        if (structure == null)
            throw new Error(`Could not find structure for overload: ${overloadStructure.getName()}`);

        const overloadBaseStructures = overloadStructure.getDescendantBaseStructures();
        const structureBaseStructures = structure.getDescendantBaseStructures().filter(s => isAllowedStructure(s));

        for (let i = overloadBaseStructures.length - 1; i >= 0; i--) {
            const findIndex = structureBaseStructures.map(s => s.getName()).indexOf(overloadBaseStructures[i].getName());
            if (findIndex >= 0) {
                overloadBaseStructures.splice(i, 1);
                structureBaseStructures.splice(findIndex, 1);
            }
        }

        for (const remainingOverload of overloadBaseStructures)
            addProblem({
                filePath: overloadStructure.getFilePath(),
                lineNumber: overloadStructure.getStartLineNumber(),
                message: `${overloadStructure.getName()} does not have overload extension of ${remainingOverload.getName()}.`
            });

        for (const remainingStructure of structureBaseStructures)
            addProblem({
                filePath: overloadStructure.getFilePath(),
                lineNumber: overloadStructure.getStartLineNumber(),
                message: `${overloadStructure.getName()} does not have structure extension of ${remainingStructure.getName()}`
            });
    }
}

function isAllowedStructure(structure: Structure) {
    switch (structure.getName()) {
        case "NamedNodeStructure":
        case "NameableNodeStructure":
        case "PropertyNamedNodeStructure":
        case "FunctionLikeDeclarationStructure":
        case "BodiedNodeStructure":
        case "BodyableNodeStructure":
        case "StatementedNodeStructure":
        case "DecoratableNodeStructure":
            return false;
    }

    if (structure.getName().indexOf("SpecificStructure") > 0)
        return false;

    return true;
}
