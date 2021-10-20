import * as tl from 'azure-pipelines-task-lib'
import * as wa from 'azure-devops-node-api/WebApi'
import * as GitInterfaces from 'azure-devops-node-api/interfaces/GitInterfaces'
import VariableResolver from './variableresolver'
import { IGitApi, GitApi } from 'azure-devops-node-api/GitApi'
import path from 'path'
import { IRequestHandler } from 'azure-devops-node-api/interfaces/common/VsoBaseInterfaces'

export interface IClientFactory {
  create: () => Promise<IGitApi>
}

class ClientFactory implements IClientFactory {
  public async create (): Promise<IGitApi> {
    const authType = tl.getInput('AuthType') || 'patService' // default for V0
    let credHandler: IRequestHandler

    switch (authType) {
      case 'patService': {
        const patService = tl.getInput('AzureDevOpsService')!
        const pat = tl.getEndpointAuthorizationParameter(patService, 'pat', false)!
        credHandler = wa.getPersonalAccessTokenHandler(pat)
        break
      }
      case 'pat': {
        const pat = tl.getInput('AzureDevOpsPat')!
        credHandler = wa.getPersonalAccessTokenHandler(pat)
        break
      }
      case 'system': {
        const token = tl.getVariable('System.AccessToken')!
        credHandler = wa.getBearerHandler(token)
        break
      }
      default:
        throw 'Unknown authentication type'
    }

    const connection = new wa.WebApi(tl.getVariable('System.TeamFoundationCollectionUri')!, credHandler)
    return await connection.getGitApi()
  }
}

export class CreatePRCommentTask {
  factory: IClientFactory

  constructor (clientFactory: IClientFactory) {
    this.factory = clientFactory
  }

  public async run (): Promise<void> {
    try {
      tl.setResourcePath(path.join(__dirname, 'task.json'), true)
      const commentOriginal = tl.getInput('Comment', true)!
      tl.debug('commentOriginal:' + commentOriginal)
      const comment = VariableResolver.resolveVariables(commentOriginal)
      tl.debug('comment:' + comment)

      const client = await this.factory.create()

      const commentObject = <GitInterfaces.Comment> {
        content: comment,
        commentType: GitInterfaces.CommentType.System
      }
      const thread: GitInterfaces.GitPullRequestCommentThread = <GitInterfaces.GitPullRequestCommentThread> {
        comments: [
          commentObject
        ],
        status: GitInterfaces.CommentThreadStatus.ByDesign
      }
      const repositoryId = tl.getVariable('Build.Repository.ID')!
      const pullRequestIdString = tl.getVariable('System.PullRequest.PullRequestId')

      if (pullRequestIdString === undefined) {
        // If the build is not pull request, do nothing.
        return
      }

      const pullRequestId: number = pullRequestIdString ? parseInt(pullRequestIdString) : 0

      const currentThreads = await client.getThreads(repositoryId, pullRequestId)
      for (var currentThread of currentThreads) {
        if (currentThread.comments !== null && currentThread.comments !== undefined) {
          for (var threadComment of currentThread.comments) {
            if (threadComment.content === comment) {
              return // If the same comment is already there.
            }
          }
        }
      }

      if (pullRequestId != 0) {
        const createdThread = await client.createThread(thread, repositoryId, pullRequestId)
      }
    } catch (e) {
      throw new Error(tl.loc('FailToCreateComment', e))
    }
  }
}

new CreatePRCommentTask(new ClientFactory()).run()
