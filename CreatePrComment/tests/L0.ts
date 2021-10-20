import * as assert from 'assert'
import * as sinon from 'sinon'
import rewiremock from 'rewiremock'
import { should as Should, expect } from 'chai'
import { IGitApi, GitApi } from 'azure-devops-node-api/GitApi'
import * as GitInterfaces from 'azure-devops-node-api/interfaces/GitInterfaces'

var should = Should()

const debugMessages: string[] = []
let variables: {[key: string]: string} = {}
const inputs: {[key: string]: string} = {}

rewiremock('azure-pipelines-task-lib')
  .with({
    debug: sinon.stub().callsFake(m => debugMessages.push(m)),
    getInput: sinon.stub().callsFake(i => { return inputs[i] || null }),
    getVariable: sinon.stub().callsFake(v => { return variables[v] || null }),
    getEndpointAuthorizationParameter: () => 'fooPAT',
    loc: sinon.stub().returnsArg(0)
  })

rewiremock.enable()

import { IClientFactory, CreatePRCommentTask } from '../src/task'

class ClientFactoryMock implements IClientFactory {
  called: boolean = false
  createdCommentThread: GitInterfaces.GitPullRequestCommentThread = {}
  createdRepositoryId: string = ''
  createdPullRequestId: number = 0
  expectedThreads: GitInterfaces.GitPullRequestCommentThread[] = []

  public async create (): Promise<IGitApi> {
    const gitApiStub = <IGitApi> {
      getThreads: async (repositoryId: string, pullRequestId: number, project?: string, iteration?: number, baseIteration?: number): Promise<GitInterfaces.GitPullRequestCommentThread[]> => {
        return await new Promise<GitInterfaces.GitPullRequestCommentThread[]>(
          (resolve: (value: GitInterfaces.GitPullRequestCommentThread[]) => void, reject: (reason?: any) => void) => {
            resolve(this.expectedThreads)
          })
      },
      createThread: async (commentThread: GitInterfaces.GitPullRequestCommentThread, repositoryId: string, pullRequestId: number, project?: string): Promise<GitInterfaces.GitPullRequestCommentThread> => {
        return await new Promise<GitInterfaces.GitPullRequestCommentThread>(
          (resolve: (value: GitInterfaces.GitPullRequestCommentThread) => void, reject: (reason?: any) => void) => {
            this.createdCommentThread = commentThread
            this.createdRepositoryId = repositoryId
            this.createdPullRequestId = pullRequestId
            this.called = true
            resolve(undefined!) // currently not used.
          })
      }
    }
    return gitApiStub
  }
}

describe('CreatePRCommentTaskV0 Tests', function () {
  it('run all inputs function', async () => {
    const factoryMock: IClientFactory = new ClientFactoryMock()
    variables['Build.Repository.ID'] = '3'
    variables['System.PullRequest.PullRequestId'] = '4'
    inputs.AzureDevOpsService = 'devopspat'
    inputs.Comment = 'foo'

    const commentTask = new CreatePRCommentTask(factoryMock)
    await commentTask.run();

    (factoryMock as ClientFactoryMock).called.should.be.true
  })

  it('run substitution', async () => {
    const factoryMock: IClientFactory = new ClientFactoryMock()
    variables['Build.Repository.ID'] = '3'
    variables['System.PullRequest.PullRequestId'] = '4'
    variables.Bar = 'bar'
    inputs.AzureDevOpsService = 'devopspat'
    inputs.Comment = 'foo, $(Bar)'

    const commentTask = new CreatePRCommentTask(factoryMock)
    await commentTask.run()
    const comments = (factoryMock as ClientFactoryMock).createdCommentThread.comments
    if (comments !== undefined) {
      const content = comments[0].content
      if (content !== undefined) {
        content.should.be.equal('foo, bar')
      } else {
        assert.fail('content is undefined')
      }
    } else {
      assert.fail('comments is undefined')
    }
  })

  it('ignored if it is non-pullrequest pipeline', async () => {
    const factoryMock: IClientFactory = new ClientFactoryMock()
    variables = {}
    variables['Build.Repository.ID'] = '3'
    inputs.AzureDevOpsService = 'devopspat'
    inputs.Comment = 'foo'

    const commentTask = new CreatePRCommentTask(factoryMock)
    await commentTask.run();

    (factoryMock as ClientFactoryMock).called.should.be.false
  })

  it('suppress the comment if there is already created', async () => {
    const factoryMock: IClientFactory = new ClientFactoryMock()
    variables['Build.Repository.ID'] = '3'
    variables['System.PullRequest.PullRequestId'] = '4'
    inputs.AzureDevOpsService = 'devopspat'
    inputs.Comment = 'foo'
    const commentObject = <GitInterfaces.Comment> {
      content: 'foo'
    }
    const thread: GitInterfaces.GitPullRequestCommentThread = <GitInterfaces.GitPullRequestCommentThread> {
      comments: [
        commentObject
      ]
    };
    (factoryMock as ClientFactoryMock).expectedThreads = [thread]

    const commentTask = new CreatePRCommentTask(factoryMock)
    await commentTask.run();

    (factoryMock as ClientFactoryMock).called.should.be.false
  })
})

rewiremock.disable()
