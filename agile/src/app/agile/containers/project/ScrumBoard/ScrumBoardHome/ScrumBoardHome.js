import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import { Page, Header, Content, stores } from 'choerodon-front-boot';
import { Button, Select, Spin, message, Icon, Modal, Input, Form, Tooltip } from 'choerodon-ui';
import _ from 'lodash';
import { DragDropContext } from 'react-beautiful-dnd';
import { withRouter } from 'react-router-dom';
import ScrumBoardStore from '../../../../stores/project/scrumBoard/ScrumBoardStore';
import StatusColumn from '../ScrumBoardComponent/StatusColumn/StatusColumn';
import StatusBodyColumn from '../ScrumBoardComponent/StatusBodyColumn/StatusBodyColumn';
import './ScrumBoardHome.scss';
import IssueDetail from '../ScrumBoardComponent/IssueDetail/IssueDetail';
import SwimLaneContext from '../ScrumBoardComponent/SwimLaneContext/SwimLaneContext';
import BacklogStore from '../../../../stores/project/backlog/BacklogStore';
import CloseSprint from '../../Backlog/BacklogComponent/SprintComponent/CloseSprint';
import EmptyScrumboard from '../../../../assets/image/emptyScrumboard.png';

const Option = Select.Option;
const { Sidebar } = Modal;
const FormItem = Form.Item;
let scroll;
const { AppState } = stores;
const confirm = Modal.confirm;

@observer
class ScrumBoardHome extends Component {
  constructor(props) {
    super(props);
    this.state = {
      spinIf: false,
      selectedBoard: '',
      onlyMe: false,
      recent: false,
      expand: true,
      addBoard: false,
      closeSprintVisible: false,
      judgeUpdateParent: {},
      updateParentStatus: null,
      quickFilter: [],
      more: false,
      expandFilter: false,
    };
  }
  componentDidMount() {
    this.getBoard();
    const url = this.GetRequest(this.props.location.search);
    if (url.paramIssueId) {
      ScrumBoardStore.setClickIssueDetail({ issueId: url.paramIssueId });
    }
  }
  getSnapshotBeforeUpdate(prevProps, prevState) {
    if (document.getElementsByClassName('c7n-scrumTools-left').length > 0 && !prevState.more) {
      if (document.getElementsByClassName('c7n-scrumTools-left')[0].scrollHeight > document.getElementsByClassName('c7n-scrumTools-left')[0].clientHeight) {
        this.setState({
          more: true,
        });
      }
    }
    return null;
  }
  componentWillUnmount() {
    ScrumBoardStore.setClickIssueDetail({});
  }
  getBoard() {
    ScrumBoardStore.axiosGetBoardList().then((data) => {
      let index;
      for (let i = 0, len = data.length; i < len; i += 1) {
        if (data[i].userDefault) {
          index = i;
        }
      }
      if (!index) {
        index = 0;
      }
      ScrumBoardStore.setBoardList(data);
      ScrumBoardStore.setCurrentConstraint(data[index].columnConstraint);
      ScrumBoardStore.setSwimLaneCode(data[index].swimlaneBasedCode);
      ScrumBoardStore.setSelectedBoard(data[index].boardId);
      this.refresh(data[index].boardId);
    }).catch((error) => {
    });
  }
  GetRequest(url) {
    const theRequest = {};
    if (url.indexOf('?') !== -1) {
      const str = url.split('?')[1];
      const strs = str.split('&');
      for (let i = 0; i < strs.length; i += 1) {
        theRequest[strs[i].split('=')[0]] = decodeURI(strs[i].split('=')[1]);
      }
    }
    return theRequest;
  }
  refresh(boardId) {
    this.setState({
      spinIf: true,
    });
    ScrumBoardStore.axiosGetQuickSearchList().then((res) => {
      ScrumBoardStore.setQuickSearchList(res);
      ScrumBoardStore.axiosGetBoardData(boardId,
        this.state.onlyMe ? AppState.getUserId : 0,
        this.state.recent,
        this.state.quickFilter,
      ).then((data) => {
        ScrumBoardStore.axiosGetAllEpicData().then((data2) => {
          const parentIds = [];
          const assigneeIds = [];
          const storeParentIds = [];
          const storeAssignee = [];
          const epicData = data.epicInfo ? data.epicInfo : [];
          for (let index = 0, len = data.columnsData.columns.length; index < len; index += 1) {
            for (let index2 = 0, len2 = data.columnsData.columns[index].subStatuses.length; index2 < len2; index2 += 1) {
              for (let index3 = 0, len3 = data.columnsData.columns[index].subStatuses[index2].issues.length; index3 < len3; index3 += 1) {
                if (data.parentIds.indexOf(parseInt(data.columnsData.columns[index].subStatuses[index2].issues[index3].issueId, 10)) !== -1) {
                  if (parentIds.indexOf(data.columnsData.columns[index].subStatuses[index2].issues[index3].issueId) === -1) {
                    parentIds.push(data.columnsData.columns[index].subStatuses[index2].issues[index3].issueId);
                    storeParentIds.push({
                      status: data.columnsData.columns[index].subStatuses[index2].name,
                      categoryCode: data.columnsData.columns[index].subStatuses[index2].categoryCode,
                      ...data.columnsData.columns[index].subStatuses[index2].issues[index3],
                    });
                  }
                }
                if (data.assigneeIds.indexOf(parseInt(data.columnsData.columns[index].subStatuses[index2].issues[index3].assigneeId, 10)) !== -1) {
                  if (assigneeIds.indexOf(data.columnsData.columns[index].subStatuses[index2].issues[index3].assigneeId) === -1) {
                    if (data.columnsData.columns[index].subStatuses[index2].issues[index3].assigneeId) {
                      assigneeIds.push(data.columnsData.columns[index].subStatuses[index2].issues[index3].assigneeId);
                      storeAssignee.push({
                        assigneeId: data.columnsData.columns[index].subStatuses[index2].issues[index3].assigneeId,
                        assigneeName: data.columnsData.columns[index].subStatuses[index2].issues[index3].assigneeName,
                        imageUrl: data.columnsData.columns[index].subStatuses[index2].issues[index3].imageUrl,
                      });
                    }
                  }
                }
              }
            }
          }
          for (let index = 0, len = epicData.length; index < len; index += 1) {
            for (let index2 = 0, len2 = data2.length; index2 < len2; index2 += 1) {
              if (String(epicData[index].epicId) === String(data2[index2].issueId)) {
                epicData[index].color = data2[index2].color;
              }
            }
          }

          ScrumBoardStore.setAssigneer(storeAssignee);
          ScrumBoardStore.setCurrentSprint(data.currentSprint);
          ScrumBoardStore.setParentIds(storeParentIds);
          ScrumBoardStore.setEpicData(epicData);
          const newColumnData = data.columnsData.columns;
          const statusList = [];
          for (let index = 0, len = newColumnData.length; index < len; index += 1) {
            if (newColumnData[index].subStatuses) {
              for (let index2 = 0, len2 = newColumnData[index].subStatuses.length; index2 < len2; index2 += 1) {
                statusList.push({
                  id: newColumnData[index].subStatuses[index2].id,
                  name: newColumnData[index].subStatuses[index2].name,
                });
                if (newColumnData[index].subStatuses[index2].issues) {
                  for (let index3 = 0, len3 = newColumnData[index].subStatuses[index2].issues.length; index3 < len3; index3 += 1) {
                    newColumnData[index].subStatuses[index2].issues[index3].statusName = newColumnData[index].subStatuses[index2].name;
                    newColumnData[index].subStatuses[index2].issues[index3].categoryCode = newColumnData[index].subStatuses[index2].categoryCode;
                  }
                }
              }
            }
          }
          ScrumBoardStore.setStatusList(statusList);
          ScrumBoardStore.setBoardData(newColumnData);
          // this.storeIssueNumberCount(storeParentIds, )
          this.setState({
            spinIf: false,
          });
        });
      }).catch((error) => {
      });
    }).catch((error) => {
    });
  }
  // storeIssueNumberCount(storeParentIds, columns) {

  // }
  /**
   *拖动结束事件
   *
   * @param {*} result
   * @returns
   * @memberof ScrumBoardHome
   */
  handleDragEnd(result) {
    ScrumBoardStore.setDragStartItem({});
    if (!result.destination) {
      return;
    }
    const originState = JSON.parse(JSON.stringify(ScrumBoardStore.getBoardData));
    let flag = 0;
    if (ScrumBoardStore.getCurrentConstraint === 'issue') {
      // 问题计数
      if (JSON.parse(result.source.droppableId).columnId !== 
      JSON.parse(result.destination.droppableId).columnId) {
        // 如果是拖不同列
        for (let oriIndex = 0, len = originState.length; oriIndex < len; oriIndex += 1) {
          if (String(originState[oriIndex].columnId) === String(JSON.parse(result.source.droppableId).columnId)) {
            let totalIssues = 0;
            for (let index = 0, len2 = originState[oriIndex].subStatuses.length; index < len2; index += 1) {
              totalIssues += originState[oriIndex].subStatuses[index].issues.length;
            }
            if (originState[oriIndex].minNum >= totalIssues) {
              flag = 1;
              message.info(`少于列${originState[oriIndex].name}的最小长度，无法更新`);
            }
          }
        }
        for (let oriIndex = 0, len = originState.length; oriIndex < len; oriIndex += 1) {
          if (String(originState[oriIndex].columnId) === 
          String(JSON.parse(result.destination.droppableId).columnId)) {
            let totalIssues = 0;
            for (let index = 0, len2 = originState[oriIndex].subStatuses.length; index < len2; index += 1) {
              totalIssues += originState[oriIndex].subStatuses[index].issues.length;
            }
            if (originState[oriIndex].maxNum <= totalIssues) {
              flag = 1;
              message.info(`多于列${originState[oriIndex].name}的最大长度，无法更新`);
            }
          }
        }
      }
    } else if (ScrumBoardStore.getCurrentConstraint === 'issue_without_sub_task') {
      // 问题计数 不包含子任务
      if (JSON.parse(result.source.droppableId).columnId !== 
      JSON.parse(result.destination.droppableId).columnId) {
        // 如果是拖不同列
        for (let oriIndex = 0, len = originState.length; oriIndex < len; oriIndex += 1) {
          if (String(originState[oriIndex].columnId) === String(JSON.parse(result.source.droppableId).columnId)) {
            let totalIssues = 0;
            for (let index = 0, len2 = originState[oriIndex].subStatuses.length; index < len2; index += 1) {
              for (let index2 = 0, len3 = originState[oriIndex].subStatuses[index].issues.length; index2 < len3; index2 += 1) {
                if (originState[oriIndex].subStatuses[index].issues[index2].typeCode !== 'sub_task') {
                  totalIssues += 1;
                }
              }
            }
            if (originState[oriIndex].minNum >= totalIssues) {
              flag = 1;
              message.info(`少于列${originState[oriIndex].name}的最小长度，无法更新`);
            }
          }
        }
        for (let oriIndex = 0, len = originState.length; oriIndex < len; oriIndex += 1) {
          if (String(originState[oriIndex].columnId) === 
          String(JSON.parse(result.destination.droppableId).columnId)) {
            let totalIssues = 0;
            for (let index = 0, len2 = originState[oriIndex].subStatuses.length; index < len2; index += 1) {
              for (let index2 = 0, len3 = originState[oriIndex].subStatuses[index].issues.length; index2 < len3; index2 += 1) {
                if (originState[oriIndex].subStatuses[index].issues[index2].typeCode !== 'sub_task') {
                  totalIssues += 1;
                }
              }
            }
            if (originState[oriIndex].maxNum <= totalIssues) {
              flag = 1;
              message.info(`多于列${originState[oriIndex].name}的最大长度，无法更新`);
            }
          }
        }
      }
    }
    if (flag === 0) {
      // this.setState({
      //   spinIf: true,
      // });
      const newState = _.clone(ScrumBoardStore.getBoardData);
      const issueId = JSON.parse(result.draggableId).issueId;
      const objectVersionNumber = JSON.parse(result.draggableId).objectVersionNumber;
      const statusCode = JSON.parse(result.destination.droppableId).code;
      // const splitData = result.draggableId.split(',');
      // const splitData2 = result.destination.droppableId.split(',');
      let draggableData = {};
      for (let index = 0, len = newState.length; index < len; index += 1) {
        if (String(newState[index].columnId) === String(JSON.parse(result.source.droppableId).columnId)) {
          for (let index2 = 0, len2 = newState[index].subStatuses.length; index2 < len2; index2 += 1) {
            if (String(newState[index].subStatuses[index2].id) === String(JSON.parse(result.source.droppableId).code)) {
              let spliceIndex = '';
              for (let index3 = 0, len3 = newState[index].subStatuses[index2].issues.length; index3 < len3; index3 += 1) {
                if (String(newState[index].subStatuses[index2].issues[index3].issueId) === String(issueId)) {
                  spliceIndex = index3;
                }
              }
              draggableData = 
              newState[index].subStatuses[index2].issues.splice(spliceIndex, 1)[0];
            }
          }
        }
      }
      for (let index = 0, len = newState.length; index < len; index += 1) {
        if (String(newState[index].columnId) === 
        String(JSON.parse(result.destination.droppableId).columnId)) {
          for (let index2 = 0, len2 = newState[index].subStatuses.length; index2 < len2; index2 += 1) {
            if (String(newState[index].subStatuses[index2].id) === 
            String(JSON.parse(result.destination.droppableId).code)) {
              newState[index].subStatuses[index2].issues.splice(
                result.destination.index, 0, draggableData);
            }
          }
        }
      }
      ScrumBoardStore.setBoardData(newState);
      let destinationStatus;
      ScrumBoardStore.updateIssue(
        issueId, objectVersionNumber, statusCode, ScrumBoardStore.getSelectedBoard,
        JSON.parse(result.source.droppableId).columnId, 
        JSON.parse(result.destination.droppableId).columnId,
      ).then((data) => {
        if (data.failed) {
          message.info(data.message);
          ScrumBoardStore.setBoardData(originState);
        } else {
          for (let index = 0, len = ScrumBoardStore.getStatusList.length; index < len; index += 1) {
            if (data.statusId === ScrumBoardStore.getStatusList[index].id) {
              draggableData.statusName = ScrumBoardStore.getStatusList[index].name;
            }
          }
          draggableData.objectVersionNumber = data.objectVersionNumber;
          draggableData.categoryCode = JSON.parse(result.destination.droppableId).categoryCode;
          for (let index = 0, len = newState.length; index < len; index += 1) {
            if (String(newState[index].columnId) === 
            String(JSON.parse(result.destination.droppableId).columnId)) {
              for (let index2 = 0, len2 = newState[index].subStatuses.length; index2 < len2; index2 += 1) {
                if (String(newState[index].subStatuses[index2].id) === 
                String(JSON.parse(result.destination.droppableId).code)) {
                  destinationStatus = newState[index].subStatuses[index2].categoryCode;
                  newState[index].subStatuses[index2].issues.splice(
                    result.destination.index, 1, draggableData);
                }
              }
            }
          }
          ScrumBoardStore.setBoardData(newState);
          if (draggableData.parentIssueId) {
            if (destinationStatus === 'done') {
              let parentIdCode;
              let parentIdNum;
              let parentObjectVersionNumber;
              for (let index = 0, len = ScrumBoardStore.getParentIds.length; index < len; index += 1) {
                if (ScrumBoardStore.getParentIds[index].issueId === draggableData.parentIssueId) {
                  parentIdCode = ScrumBoardStore.getParentIds[index].categoryCode;
                  parentIdNum = ScrumBoardStore.getParentIds[index].issueNum;
                  parentObjectVersionNumber = ScrumBoardStore.getParentIds[index].objectVersionNumber;
                }
              }
              const judge = ScrumBoardStore.judgeMoveParentToDone(
                parentIdCode, draggableData.parentIssueId);
              if (judge) {
                this.setState({
                  judgeUpdateParent: {
                    id: draggableData.parentIssueId,
                    issueNumber: parentIdNum,
                    code: parentIdCode,
                    objectVersionNumber: parentObjectVersionNumber,
                  },
                });
              }
            }
          }
        }
      }).catch((error) => {
        ScrumBoardStore.setBoardData(JSON.parse(JSON.stringify(originState)));
      });
    }
  }
  /**
   *创建面板
   *
   * @param {*} e
   * @memberof ScrumBoardHome
   */
  handleCreateBoard(e) {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        ScrumBoardStore.axiosCreateBoard(values.name).then((res) => {
          this.props.form.resetFields();
          message.success('创建成功');
          this.setState({
            addBoard: false,
          });
          this.getBoard();
        }).catch((error) => {
        });
      }
    });
  }
  /**
   *仅故事
   *
   * @memberof ScrumBoardHome
   */
  filterOnlyStory() {
    this.setState({
      recent: !this.state.recent,
    }, () => {
      this.refresh(ScrumBoardStore.getSelectedBoard);
    });
  }
  /**
   *仅我的
   *
   * @memberof ScrumBoardHome
   */
  filterOnlyMe() {
    this.setState({
      onlyMe: !this.state.onlyMe,
    }, () => {
      this.refresh(ScrumBoardStore.getSelectedBoard);
    });
  }
  /**
   *完成冲刺
   *
   * @memberof ScrumBoardHome
   */
  handleFinishSprint() {
    BacklogStore.axiosGetSprintCompleteMessage(
      ScrumBoardStore.getCurrentSprint.sprintId).then((res) => {
      BacklogStore.setSprintCompleteMessage(res);
      let flag = 0;
      if (res.parentsDoneUnfinishedSubtasks) {
        if (res.parentsDoneUnfinishedSubtasks.length > 0) {
          flag = 1;
          let issueNums = '';
          for (let index = 0, len = res.parentsDoneUnfinishedSubtasks.length; index < len; index += 1) {
            issueNums += `${res.parentsDoneUnfinishedSubtasks[index].issueNum} `;
          }
          confirm({
            title: 'warnning',
            content: `父卡${issueNums}有未完成的子任务，无法完成冲刺`,
            onCancel() {
            },
          });
        }
      }
      if (flag === 0) {
        this.setState({
          closeSprintVisible: true,
        });
      }
    }).catch((error) => {
    });
  }
  /**
   *快速搜索
   *
   * @param {*} item
   * @memberof ScrumBoardHome
   */
  filterQuick(item) {
    const newState = [...this.state.quickFilter];
    if (newState.indexOf(item.filterId) === -1) {
      newState.push(item.filterId);
    } else {
      newState.splice(newState.indexOf(item.filterId), 1);
    }
    this.setState({
      quickFilter: newState,
    }, () => {
      this.refresh(ScrumBoardStore.getSelectedBoard);
    });
  }
  // 渲染状态列表头
  renderStatusColumns() {
    const data = ScrumBoardStore.getBoardData;
    const result = [];
    for (let index = 0, len = data.length; index < len; index += 1) {
      if (data[index].subStatuses.length > 0) {
        result.push(
          <StatusColumn
            key={data[index].columnId}
            data={data[index]}
          />,
        );
      }
    }
    return result;
  }
  // 渲染issue列
  renderIssueColumns(id) {
    const result = [];
    const data = ScrumBoardStore.getBoardData;
    if (ScrumBoardStore.getSwimLaneCode === 'parent_child') {
      for (let index = 0, len = data.length; index < len; index += 1) {
        if (data[index].subStatuses.length > 0) {
          result.push(
            <StatusBodyColumn
              key={data[index].columnId}
              data={data[index]}
              parentId={id}
              source={_.isUndefined(id) ? 'other' : id}
            />,
          );
        }
      }
    } else if (ScrumBoardStore.getSwimLaneCode === 'assignee') {
      for (let index = 0, len = data.length; index < len; index += 1) {
        if (data[index].subStatuses.length > 0) {
          result.push(
            <StatusBodyColumn
              key={data[index].columnId}
              data={data[index]}
              assigneeId={id}
            />,
          );
        }
      }
    } else if (ScrumBoardStore.getSwimLaneCode === 'swimlane_epic') {
      for (let index = 0, len = data.length; index < len; index += 1) {
        if (data[index].subStatuses.length > 0) {
          result.push(
            <StatusBodyColumn
              key={data[index].columnId}
              data={data[index]}
              epicId={id}
            />,
          );
        }
      }
    } else {
      for (let index = 0, len = data.length; index < len; index += 1) {
        if (data[index].subStatuses.length > 0) {
          result.push(
            <StatusBodyColumn
              key={data[index].columnId}
              data={data[index]}
            />,
          );
        }
      }
    }
    return result;
  }

  /**
   * 渲染被分配的任务列
   * @returns {Array}
   */
  renderSwimlane() {
    let ids = [];
    if (ScrumBoardStore.getSwimLaneCode === 'parent_child') {
      ids = ScrumBoardStore.getParentIds;
      ids = _.sortBy(ids, o => o.rank);
    } else if (ScrumBoardStore.getSwimLaneCode === 'assignee') {
      ids = ScrumBoardStore.getAssigneer;
      ids = _.sortBy(ids, o => o.assigneeId);
    } else if (ScrumBoardStore.getSwimLaneCode === 'swimlane_epic') {
      ids = ScrumBoardStore.getEpicData;
      ids = _.sortBy(ids, o => o.epicId);
    }
    const result = [];
    for (let index = 0, len = ids.length; index < len; index += 1) {
      result.push(
        <SwimLaneContext
          key={`${ids[index].assigneeId}-${index}`}
          data={ids[index]}
          handleDragEnd={this.handleDragEnd.bind(this)}
          renderIssueColumns={this.renderIssueColumns.bind(this)}
          changeState={(name, value) => {
            this.setState({
              [name]: value, 
            });
          }}
        />,
      );
    }
    return result;
  }
  renderHeight() {
    if (document.getElementsByClassName('c7n-scrumboard-content').length > 0) {
      return `calc(100vh - ${parseInt(document.getElementsByClassName('c7n-scrumboard-content')[0].offsetTop, 10) + 48}px)`;
    }
    return '';
  }
  /**
   *更新父任务匹配的默认选项
   *
   * @returns
   * @memberof ScrumBoardHome
   */
  renderUpdateParentDefault() {
    if (ScrumBoardStore.getBoardData.length > 0) {
      if (ScrumBoardStore.getBoardData[ScrumBoardStore.getBoardData.length - 1].columnId !== 'unset') {
        if (ScrumBoardStore.getBoardData[
          ScrumBoardStore.getBoardData.length - 1].subStatuses.length > 0) {
          return ScrumBoardStore.getBoardData[
            ScrumBoardStore.getBoardData.length - 1].subStatuses[0].id;
        }
      }
    }
    return undefined;
  }
  renderOthersTitle() {
    let result = '';
    if (ScrumBoardStore.getSwimLaneCode === 'parent_child') {
      result = '其他问题';
    } else if (ScrumBoardStore.getSwimLaneCode === 'assignee') {
      result = '未分配的问题';
    } else {
      result = '所有问题';
    }
    return result;
  }
  renderOtherSwimlane() {
    let result = '';
    const data = ScrumBoardStore.getBoardData;
    let flag = 0;
    // 如果没有其他任务则其他任务列就不渲染，
    if (ScrumBoardStore.getSwimLaneCode === 'parent_child') {
      for (let index = 0, len = data.length; index < len; index += 1) {
        if (data[index].subStatuses) {
          for (let index2 = 0, len2 = data[index].subStatuses.length; index2 < len2; index2 += 1) {
            if (data[index].subStatuses[index2].issues) {
              for (let index3 = 0, len3 = data[index].subStatuses[index2].issues.length; index3 < len3; index3 += 1) {
                if (!data[index].subStatuses[index2].issues[index3].parentIssueId) {
                  flag = 1;
                }
              }
            }
          }
        }
      }
    } else if (ScrumBoardStore.getSwimLaneCode === 'assignee') {
      for (let index = 0, len = data.length; index < len; index += 1) {
        if (data[index].subStatuses) {
          for (let index2 = 0, len2 = data[index].subStatuses.length; index2 < len2; index2 += 1) {
            if (data[index].subStatuses[index2].issues) {
              for (let index3 = 0, len3 = data[index].subStatuses[index2].issues.length; index3 < len3; index3 += 1) {
                if (!data[index].subStatuses[index2].issues[index3].assigneeId) {
                  flag = 1;
                }
              }
            }
          }
        }
      }
    } else {
      flag = 1;
    }
    // 有flag才渲染
    if (flag === 1) {
      result = (
        <div className="c7n-scrumboard-others">
          <div className="c7n-scrumboard-otherHeader">
            <Icon 
              style={{ fontSize: 17, cursor: 'pointer', marginRight: 8 }}
              type={this.state.expand ? 'keyboard_arrow_down' : 'keyboard_arrow_right'}
              role="none"
              onClick={() => {
                this.setState({
                  expand: !this.state.expand,
                });
              }}
            />
            {this.renderOthersTitle()}
          </div>
          <div
            className="c7n-scrumboard-otherContent"
            style={{
              display: this.state.expand ? 'flex' : 'none',
            }}
          >
            <DragDropContext 
              onDragEnd={this.handleDragEnd.bind(this)}
              onDragStart={(start) => {
                ScrumBoardStore.setDragStartItem(start);
              }}
            >
              {this.renderIssueColumns()}
            </DragDropContext>
          </div>
        </div>
      );
    }
    // } else {
    //   result = (
    //     
    //   );
    // }
    return result;
  }
  render() {
    const { getFieldDecorator } = this.props.form;
    return (
      <Page
        className="c7n-scrumboard-page"
        service={[
          'agile-service.board.deleteScrumBoard',
          'agile-service.issue-status.createStatus',
          'agile-service.board-column.createBoardColumn',
          'agile-service.issue-status.deleteStatus',
          'agile-service.issue-status.updateStatus',
          'agile-service.issue.deleteIssue',
          'agile-service.board.queryByProjectId',
          'agile-service.board.queryByOptions',
        ]}
      >
        <Header title="活跃冲刺">
          <Button 
            funcType="flat"
            onClick={() => {
              this.setState({
                addBoard: true,
              });
            }}
          >
            <Icon type="playlist_add icon" />
            <span>创建看板</span>
          </Button>
          <Select 
            className="select-without-underline"
            value={ScrumBoardStore.getSelectedBoard}
            style={{ maxWidth: 100, color: '#3F51B5', margin: '0 30px', fontWeight: 500, lineHeight: '28px' }}
            dropdownStyle={{
              color: '#3F51B5',
              width: 200,
            }}
            onChange={(value) => {
              let newCode;
              for (let index = 0, len = ScrumBoardStore.getBoardList.length; index < len; index += 1) {
                if (ScrumBoardStore.getBoardList[index].boardId === value) {
                  ScrumBoardStore.setCurrentConstraint(ScrumBoardStore.getBoardList[index].columnConstraint);
                  newCode = ScrumBoardStore.getBoardList[index].swimlaneBasedCode;
                }
              }
              ScrumBoardStore.setSelectedBoard(value);
              ScrumBoardStore.setSwimLaneCode(newCode);
              this.refresh(value);
            }}
          >
            {
              ScrumBoardStore.getBoardList.map(item => (
                <Option key={item.boardId} value={item.boardId}>
                  <Tooltip title={item.name}>
                    {item.name}
                  </Tooltip>
                </Option>
              ))
            }
          </Select>
          <Button className="leftBtn2" funcType="flat" onClick={this.refresh.bind(this, ScrumBoardStore.getSelectedBoard)}>
            <Icon type="refresh icon" />
            <span>刷新</span>
          </Button>
        </Header>
        <div style={{ padding: 0, display: 'flex' }}>
          <div style={{ flexGrow: 1, overflow: 'hidden' }}>
            <Spin spinning={this.state.spinIf}>
              <div className="c7n-scrumTools">
                <div style={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                  <div 
                    style={{ 
                      width: '85%',
                      flexWrap: 'wrap',
                      height: this.state.expandFilter ? '' : 27,
                    }} 
                    className="c7n-scrumTools-left"
                  >
                    <p style={{ marginRight: 24 }}>快速搜索:</p>
                    <p
                      className="c7n-scrumTools-filter"
                      style={{
                        background: this.state.onlyMe ? '#3F51B5' : '',
                        color: this.state.onlyMe ? 'white' : '#3F51B5',
                      }}
                      role="none"
                      onClick={this.filterOnlyMe.bind(this)}
                    >仅我的问题</p>
                    <p
                      className="c7n-scrumTools-filter"
                      style={{
                        background: this.state.recent ? '#3F51B5' : '',
                        color: this.state.recent ? 'white' : '#3F51B5',
                      }}
                      role="none"
                      onClick={this.filterOnlyStory.bind(this)}
                    >仅故事</p>
                    {
                      ScrumBoardStore.getQuickSearchList.length > 0 ? 
                        ScrumBoardStore.getQuickSearchList.map(item => (
                          <p
                            key={item.filterId}
                            className="c7n-scrumTools-filter"
                            style={{
                              color: this.state.quickFilter.indexOf(item.filterId) !== -1 ? 'white' : '#3F51B5',
                              background: this.state.quickFilter.indexOf(item.filterId) !== -1 ? '#3F51B5' : '',
                            }}
                            role="none"
                            onClick={this.filterQuick.bind(this, item)}
                          >
                            {item.name}
                          </p>
                        )) : ''
                    }
                  </div>
                  <div
                    style={{
                      display: this.state.more ? 'block' : 'none',
                      color: 'rgb(63, 81, 181)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                    }}
                    role="none"
                    onClick={() => {
                      this.setState({
                        expandFilter: !this.state.expandFilter,
                      });
                    }}
                  >
                    {this.state.expandFilter ? '...收起' : '...展开'}
                  </div>
                </div>
                <div className="c7n-scrumTools-right" style={{ display: 'flex', alignItems: 'center', color: 'rgba(0,0,0,0.54)' }}>
                  <Icon type="av_timer" />
                  <span style={{ paddingLeft: 5, marginLeft: 0, marginRight: 15 }}>{`${ScrumBoardStore.getCurrentSprint && ScrumBoardStore.getCurrentSprint.dayRemain >= 0 ? `${ScrumBoardStore.getCurrentSprint.dayRemain} days剩余` : '无剩余时间'}`}</span>
                  <Button
                    funcType="flat"
                    onClick={this.handleFinishSprint.bind(this)}
                  >
                    <Icon type="power_settings_new icon" />
                    <span style={{ marginLeft: 0 }}>完成Sprint</span>
                  </Button>
                  <Button
                    funcType="flat"
                    onClick={() => {
                      const { history } = this.props;
                      const urlParams = AppState.currentMenuType;
                      history.push(`/agile/scrumboard/setting?type=${urlParams.type}&id=${urlParams.id}&name=${urlParams.name}&organizationId=${urlParams.organizationId}&boardId=${ScrumBoardStore.getSelectedBoard}`);
                    }}
                  >
                    <Icon type="settings icon" />
                    <span style={{ marginLeft: 0 }}>配置</span>
                  </Button>
                </div>
              </div>
              {
                this.state.closeSprintVisible ? (
                  <CloseSprint
                    store={BacklogStore}
                    visible={this.state.closeSprintVisible}
                    onCancel={() => {
                      this.setState({
                        closeSprintVisible: false,
                      });
                    }}
                    data={{
                      sprintId: ScrumBoardStore.getCurrentSprint.sprintId,
                      sprintName: ScrumBoardStore.getCurrentSprint.sprintName,
                    }}
                    refresh={this.getBoard.bind(this)}
                  />
                ) : ''
              }
              <div className="c7n-scrumboard">
                <div className="c7n-scrumboard-header">
                  {this.renderStatusColumns()}
                </div>
                <div
                  className="c7n-scrumboard-content"
                  style={{
                    height: `calc(100vh - ${58}px)`,
                    paddingBottom: 83,
                  }}
                >
                  {
                    ScrumBoardStore.getCurrentSprint ? (
                      <div className="c7n-scrumboard-container">
                        {this.renderSwimlane()}
                        {this.renderOtherSwimlane()}
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginTop: '80px',
                        }}
                      >
                        <img style={{ width: 170 }} src={EmptyScrumboard} alt="emptyscrumboard" />
                        <div
                          style={{
                            marginLeft: 40,
                          }}
                        >
                          <p style={{ color: 'rgba(0,0,0,0.65)' }}>没有活动的Sprint</p>
                          <p style={{ fontSize: 20, lineHeight: '34px' }}>在<span style={{ color: '#3f51b5' }}>待办事项</span>中开始Sprint</p>
                        </div>
                      </div>
                    )
                  }
                </div>
              </div>
            </Spin>
          </div>
          <IssueDetail
            visible={JSON.stringify(ScrumBoardStore.getClickIssueDetail) !== '{}'}
            refresh={this.refresh.bind(this, ScrumBoardStore.getSelectedBoard)}
          />
          <Modal
            closable={false}
            title="更新父问题"
            visible={JSON.stringify(this.state.judgeUpdateParent) !== '{}'}
            onCancel={() => {
              this.setState({
                judgeUpdateParent: {},
                updateParentStatus: null,
              });
            }}
            onOk={() => {
              const data = {
                issueId: this.state.judgeUpdateParent.id,
                objectVersionNumber: this.state.judgeUpdateParent.objectVersionNumber,
                statusId: this.state.updateParentStatus ? 
                  this.state.updateParentStatus : ScrumBoardStore.getBoardData[
                    ScrumBoardStore.getBoardData.length - 1].subStatuses[0].id,
              };
              BacklogStore.axiosUpdateIssue(data).then((res) => {
                this.refresh(ScrumBoardStore.getSelectedBoard);
                this.setState({
                  judgeUpdateParent: {},
                  updateParentStatus: null,
                });
              }).catch((error) => {
              });
            }}
          >
            <p>任务{this.state.judgeUpdateParent.issueNumber}的全部子任务为done</p>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <p style={{ marginRight: 20 }}>您是否要更新父问题进行匹配</p>
              <Select 
                style={{
                  width: 250,
                }}
                onChange={(value) => {
                  this.setState({
                    updateParentStatus: value,
                  });
                }}
                defaultValue={this.renderUpdateParentDefault()}
              >
                {
                  ScrumBoardStore.getBoardData.length > 0 ?
                    ScrumBoardStore
                      .getBoardData[ScrumBoardStore.getBoardData.length - 1].subStatuses
                      .map(item => (
                        <Option key={item.id} value={item.id}>{item.name}</Option>
                      )) : ''
                }
              </Select>
            </div>
          </Modal>
          <Sidebar
            title="创建看板"
            visible={this.state.addBoard}
            onCancel={() => {
              this.setState({
                addBoard: false,
              });
            }}
            okText="创建"
            cancelText="取消"
            onOk={this.handleCreateBoard.bind(this)}
          >
            <Content
              style={{ padding: 0 }}
              title={`创建项目“${AppState.currentMenuType.name}”的看板`}
              description="请在下面输入看板名称，创建一个新的board。新的board会默认为您创建'待处理'、'处理中'、'已完成'三个列，同时将todo、doing、done三个类别的状态自动关联入三个列中。"
              link="http://v0-8.choerodon.io/zh/docs/user-guide/agile/sprint/create-kanban/"
            >
              <Form>
                <FormItem>
                  {getFieldDecorator('name', {
                    rules: [{
                      required: true, message: '看板名是必须的',
                    }],
                  })(
                    <Input
                      style={{
                        width: 512,
                      }}
                      label="看板名称"
                      maxLength={30}
                    />,
                  )}
                </FormItem>
              </Form>
            </Content>
          </Sidebar>
        </div>
      </Page>
    );
  }
}

export default Form.create()(ScrumBoardHome);

