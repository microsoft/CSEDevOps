# Create PR Comment Task

![Comment](https://raw.githubusercontent.com/microsoft/CSEDevOps/main/CreatePrComment/docs/images/Comment.png)

Create a Pull Request comment if a CI is triggered by Pull Request.

## How to use

### Configuration

Install this extension to your project. Find the CreatePRCommentTask.

![CreatePRCommentTask](https://raw.githubusercontent.com/microsoft/CSEDevOps/main/CreatePrComment/docs/images/CreatePRCommentTask.png)

### Details

![Task details](https://raw.githubusercontent.com/microsoft/CSEDevOps/main/CreatePrComment/docs/images/CommentTask.png)

| Name             | Description                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| Azure DevOps PAT | Select Azure DevOps Personal Access Token. or you can create new one                             |
| Comment          | If the pipeline is executed by Pull Request Validation, this task create a Pull Request Comment. |

On the Comment, you can use Variables. The variables will be substituted by the actual value. e.g. `$(CWI.Id)`.
The comment becomes message body of your Pull Request Comment.

### Personal Access Token Service Connection

Put your Azure DevOps Personal Access Token in `PAT`. The PAT requires permission to write Code. For more detail, [Pull Request Thread Comments - Create](https://docs.microsoft.com/en-us/rest/api/azure/devops/git/pull-request-thread-comments/create?view=azure-devops-rest-6.1). `Connection name` is just a label of this service connection. `Server URL` is not used currently, however it might be good as memo which you use it for.

![ServiceConnection](https://raw.githubusercontent.com/microsoft/CSEDevOps/main/CreatePrComment/docs/images/ServiceConnection.png)

### Example

Sample of the Comment.

```text
CredScan reports a <a href="https://dev.azure.com/csedevops/DevSecOps/_workitems/edit/$(CWI.Id)">Bug</a>. Please review it.
```

## Contribution

For more details [here](https://github.com/microsoft/CSEDevOps/blob/main/CreatePrComment/CONTRIBUTION.md).
