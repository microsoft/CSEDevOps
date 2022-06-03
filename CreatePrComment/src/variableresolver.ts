import { getVariable, debug } from 'azure-pipelines-task-lib'

export default class VariableResolver {
  private static readonly variableRegExp = /\$\(([^)]+)\)/g

  public static resolveVariables (origValue: string): string {
    let newValue = origValue

    let match: RegExpExecArray | null
    while ((match = this.variableRegExp.exec(newValue)) !== null) {
      const variableValue = getVariable(match[1])
      if (variableValue && variableValue !== '') {
        newValue = this.replaceAll(newValue, match[0], variableValue)
        this.variableRegExp.lastIndex = 0
      } else {
        debug('Variable \'' + match[1] + '\' not defined.')
      }
    }

    return newValue
  }

  private static escapeRegExp (expression: string): string {
    return expression.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1')
  }

  private static replaceAll (origValue: string, searchValue: string, replaceValue: string) {
    return origValue.replace(new RegExp(this.escapeRegExp(searchValue), 'g'), replaceValue)
  }
}
