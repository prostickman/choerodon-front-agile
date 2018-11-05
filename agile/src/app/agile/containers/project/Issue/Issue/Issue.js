import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import _ from 'lodash';
import {
  Page, Header, Content, stores, axios,
} from 'choerodon-front-boot';
import {
  Table, Button, Tooltip, Input, Dropdown, Menu,
  Pagination, Icon, Divider, Tag,
} from 'choerodon-ui';
import TimeAgo from 'timeago-react';
import QuickSearch from '../../../../components/QuickSearch';
import './Issue.scss';
import { loadPriorities, loadStatus } from '../../../../api/NewIssueApi';
import IssueStore from '../../../../stores/project/sprint/IssueStore';

import { TYPE, ICON, TYPE_NAME } from '../../../../common/Constant';
import pic from '../../../../assets/image/问题管理－空.png';
import { loadIssue, createIssue } from '../../../../api/NewIssueApi';
import EditIssue from '../../../../components/EditIssueWide';
import CreateIssue from '../../../../components/CreateIssueNew';
import UserHead from '../../../../components/UserHead';
import PriorityTag from '../../../../components/PriorityTag';
import StatusTag from '../../../../components/StatusTag';
import TypeTag from '../../../../components/TypeTag';
import EmptyBlock from '../../../../components/EmptyBlock';
import { STATUS } from '../../../../common/Constant';

const FileSaver = require('file-saver');

const { AppState } = stores;

@observer
class Issue extends Component {
  constructor(props) {
    super(props);
    this.state = {
      expand: false,
      create: false,
      selectedIssue: {},
      checkCreateIssue: false,
      selectIssueType: 'task',
      createIssueValue: '',
      createLoading: false,
      originPriorities: [],
      defaultPriorityId: false,
    };
  }

  componentDidMount() {
    this.getInit();
  }

  getInit() {
    const { location } = this.props;
    const Request = this.GetRequest(location.search);
    const {
      paramType, paramId, paramName, paramStatus,
      paramPriority, paramIssueType, paramIssueId, paramUrl, paramOpenIssueId,
    } = Request;
    // IssueStore.loadQuickSearch();
    IssueStore.loadCurrentSetting();
    IssueStore.setParamId(paramId);
    IssueStore.setParamType(paramType);
    IssueStore.setParamName(paramName);
    IssueStore.setParamStatus(paramStatus);
    IssueStore.setParamPriority(paramPriority);
    IssueStore.setParamIssueType(paramIssueType);
    IssueStore.setParamIssueId(paramIssueId);
    IssueStore.setParamUrl(paramUrl);
    IssueStore.setParamOpenIssueId(paramOpenIssueId);
    const arr = [];
    if (paramName) {
      arr.push(paramName);
    }
    loadPriorities().then((res) => {
      if (res && res.length) {
        const defaultPriority = res.find(p => p.default);
        const defaultPriorityId = defaultPriority ? defaultPriority.id : '';
        this.setState({
          originPriorities: res,
          defaultPriorityId,
        });
        IssueStore.setPriorities(res);
        IssueStore.setDefaultPriorityId();
      } else {
        this.setState({
          originPriorities: [],
          defaultPriorityId: '',
        });
        IssueStore.setPriorities([]);
        IssueStore.setDefaultPriorityId('');
      }
    });
    if (paramStatus) {
      const obj = {
        advancedSearchArgs: {},
        searchArgs: {},
      };
      const a = paramStatus.split(',');
      obj.advancedSearchArgs.statusCode = a || [];
      IssueStore.setBarFilters(arr);
      IssueStore.setFilter(obj);
      IssueStore.setFilteredInfo({ statusCode: paramStatus.split(',') });
      IssueStore.loadIssues();
    } else if (paramPriority) {
      const obj = {
        advancedSearchArgs: {},
        searchArgs: {},
      };
      const a = [paramPriority];
      obj.advancedSearchArgs.priorityId = a || [];
      IssueStore.setBarFilters(arr);
      IssueStore.setFilter(obj);
      IssueStore.setFilteredInfo({ priorityId: [paramPriority] });
      IssueStore.loadIssues();
    } else if (paramIssueType) {
      const obj = {
        advancedSearchArgs: {},
        searchArgs: {},
      };
      const a = [paramIssueType];
      obj.advancedSearchArgs.typeCode = a || [];
      IssueStore.setBarFilters(arr);
      IssueStore.setFilter(obj);
      IssueStore.setFilteredInfo({ typeCode: [paramIssueType] });
      IssueStore.loadIssues();
    } else if (paramIssueId) {
      IssueStore.setBarFilters(arr);
      IssueStore.init();
      IssueStore.loadIssues()
        .then((res) => {
          this.setState({
            selectedIssue: res.content.length ? res.content[0] : {},
            expand: true,
          });
        });
    } else {
      IssueStore.setBarFilters(arr);
      IssueStore.init();
      IssueStore.loadIssues();
    }
  }

  GetRequest = (url) => {
    const theRequest = {};
    if (url.indexOf('?') !== -1) {
      const str = url.split('?')[1];
      const strs = str.split('&');
      for (let i = 0; i < strs.length; i += 1) {
        theRequest[strs[i].split('=')[0]] = decodeURI(strs[i].split('=')[1]);
      }
    }
    return theRequest;
  };

  handleCreateIssue = (issueObj) => {
    const { history } = this.props;
    const {
      type, id, name, organizationId,
    } = AppState.currentMenuType;
    this.setState({ create: false });
    IssueStore.init();
    IssueStore.loadIssues();
    if (issueObj) {
      history.push(`/agile/issue?type=${type}&id=${id}&name=${encodeURIComponent(name)}&organizationId=${organizationId}&paramName=${issueObj.issueNum}&paramIssueId=${issueObj.issueId}&paramOpenIssueId=${issueObj.issueId}`);
    }
  };

  handleIssueUpdate = (issueId) => {
    const { selectedIssue } = this.state;
    let Id;
    if (!issueId) {
      Id = selectedIssue.issueId;
    } else {
      Id = issueId;
    }
    loadIssue(Id).then((res) => {
      const obj = {
        assigneeId: res.assigneeId,
        assigneeName: res.assigneeName,
        imageUrl: res.assigneeImageUrl || '',
        issueId: res.issueId,
        issueNum: res.issueNum,
        priorityDTO: res.priorityDTO,
        projectId: res.projectId,
        statusCode: res.statusCode,
        statusColor: res.statusColor,
        statusName: res.statusName,
        summary: res.summary,
        typeCode: res.typeCode,
      };
      const originIssues = _.slice(IssueStore.issues);
      const index = _.findIndex(originIssues, { issueId: res.issueId });
      originIssues[index] = obj;
      IssueStore.setIssues(originIssues);
    });
  };

  handleBlurCreateIssue = () => {
    const { defaultPriorityId, createIssueValue, selectIssueType } = this.state;
    if (defaultPriorityId && createIssueValue !== '') {
      const { history } = this.props;
      const {
        type, id, name, organizationId,
      } = AppState.currentMenuType;


      axios.get(`/agile/v1/projects/${AppState.currentMenuType.id}/project_info`)
        .then((res) => {
          const data = {
            priorityId: defaultPriorityId,
            projectId: AppState.currentMenuType.id,
            sprintId: 0,
            summary: createIssueValue,
            typeCode: selectIssueType,
            epicId: 0,
            epicName: selectIssueType === 'issue_epic' ? createIssueValue : undefined,
            parentIssueId: 0,
          };
          this.setState({
            createLoading: true,
          });
          createIssue(data)
            .then((response) => {
              IssueStore.init();
              IssueStore.loadIssues();
              this.setState({
                createIssueValue: '',
                createLoading: false,
              });
              history.push(`/agile/issue?type=${type}&id=${id}&name=${encodeURIComponent(name)}&organizationId=${organizationId}&paramName=${response.issueNum}&paramIssueId=${response.issueId}&paramOpenIssueId=${response.issueId}`);
            })
            .catch((error) => {
            });
        });
    }
  };

  handleChangeType = ({ key }) => {
    this.setState({
      selectIssueType: key,
    });
  };

  handlePaginationChange = (page, pageSize) => {
    IssueStore.loadIssues(page - 1, pageSize);
  };

  handlePaginationShowSizeChange = (current, size) => {
    IssueStore.loadIssues(current - 1, size);
  };

  handleFilterChange = (pagination, filters, sorter, barFilters) => {
    Object.keys(filters).forEach((key) => {
      if (key === 'statusId' || key === 'priorityId' || key === 'issueTypeId') {
        IssueStore.setAdvArg(filters);
      } else if (key === 'issueId') {
        // 根据接口进行对象调整
        IssueStore.setArg({ issueNum: filters[key][0] });
      } else if (key === 'assigneeId') {
        // 同上
        IssueStore.setArg({ assignee: filters[key][0] });
      } else {
        const temp = {
          [key]: filters[key][0],
        };
        IssueStore.setArg(temp);
      }
    });
    IssueStore.setBarFilters(barFilters);
    const { current, pageSize } = IssueStore.pagination;
    IssueStore.setOrder(sorter.columnKey, sorter.order === 'ascend' ? 'asc' : 'desc');
    IssueStore.loadIssues(current - 1, pageSize);
  };

  exportExcel = () => {
    const projectId = AppState.currentMenuType.id;
    const orgId = AppState.currentMenuType.organizationId;
    const searchParam = IssueStore.getFilter;
    axios.post(`/zuul/agile/v1/projects/${projectId}/issues/export?organizationId=${orgId}`, searchParam, { responseType: 'arraybuffer' })
      .then((data) => {
        const blob = new Blob([data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const fileName = `${AppState.currentMenuType.name}.xlsx`;
        FileSaver.saveAs(blob, fileName);
      });
  };


  MyTable = (props) => {
    const { expand } = this.state;
    if (IssueStore.issues.length === 0 && !IssueStore.loading) {
      return (
        <EmptyBlock
          style={{ marginTop: 40 }}
          border
          pic={pic}
          title="根据当前搜索条件没有查询到问题"
          des="尝试修改您的过滤选项或者在下面创建新的问题"
        />
      );
    }
    const renderNarrow = (
      <div style={props.style} className={props.className}>
        {props.children[1]}
        {props.children[2]}
      </div>
    );
    return expand ? renderNarrow : (<table {...props} />);
  };

  BodyWrapper = (props) => {
    const { expand } = this.state;
    const renderNarrow = (
      <div {...props} />
    );
    return expand ? renderNarrow : (<tbody {...props} />);
  };

  BodyRow = (props) => {
    const { expand } = this.state;
    const renderNarrow = (
      <div onClick={props.onClick} style={{ display: 'flex', flexDirection: 'column', margin: '10px' }} role="none">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
          <div style={{ display: 'flex' }}>
            {props.children[1]}
            {props.children[0]}
          </div>
          <div style={{ display: 'flex' }}>
            {props.children[3]}
            {props.children[4]}
            {props.children[5]}
          </div>
        </div>
        <div>{props.children[2]}</div>
        <Divider />
      </div>
    );
    return expand ? renderNarrow : (<tr {...props} />);
  };

  BodyCell = (props) => {
    const { expand } = this.state;
    return expand ? (<div {...props} style={{ marginRight: '10px' }} />) : (<td {...props} />);
  };

  renderIssueNum = (text, record, index) => (
    <Tooltip mouseEnterDelay={0.5} title={`任务编号： ${text}`}>
      <a>
        {text}
      </a>
    </Tooltip>
  );

  renderTypeCode = (text, record, index) => {
    const { expand } = this.state;
    return (
      <Tooltip mouseEnterDelay={0.5} title={`任务类型： ${TYPE_NAME[text]}`}>
        <TypeTag
          data={record.issueTypeDTO}
          showName={expand ? null : text}
        />
      </Tooltip>
    );
  };

  renderSummary = (text, record) => (
    <Tooltip mouseEnterDelay={0.5} placement="topLeft" title={`任务概要： ${text}`}>
      <span className="c7n-Issue-summary">
        {text}
      </span>
    </Tooltip>
  );

  renderStatusName = (text, record) => (
    <Tooltip mouseEnterDelay={0.5} title={`任务状态： ${text}`}>
      <StatusTag
        data={record.statusMapDTO}
        style={{ display: 'inline-block', verticalAlign: 'middle' }}
      />
    </Tooltip>
  );

  renderPriorityName = (text, record) => (
    <Tooltip mouseEnterDelay={0.5} title={`优先级： ${record.priorityDTO ? record.priorityDTO.name : ''}`}>
      <PriorityTag
        priority={record.priorityDTO}
      />
    </Tooltip>
  )

  renderReporterName = (text, record) => (record.reporterId ? (
    <Tooltip mouseEnterDelay={0.5} title={`当前处理人： ${text}`}>
      <div style={{ marginRight: 12 }}>
        <UserHead
          user={{
            id: record.reporterId,
            loginName: '',
            realName: text,
            avatar: record.imageUrl,
          }}
        />
      </div>
    </Tooltip>
  ) : null);

  renderAssigneeName = (text, record) => (record.assigneeId ? (
    <Tooltip mouseEnterDelay={0.5} title={`任务经办人： ${text}`}>
      <div style={{ marginRight: 12 }}>
        <UserHead
          user={{
            id: record.assigneeId,
            loginName: '',
            realName: text,
            avatar: record.imageUrl,
          }}
        />
      </div>
    </Tooltip>
  ) : null);

  renderLastUpdateTime = (text, record) => (
    <TimeAgo
      datetime={text}
      locale="zh_CN"
    />
  );

  renderVersion = arr => (arr.length ? <Tag color="blue">{arr[0].name}</Tag> : null);

  onlyMe = (checked) => {
    IssueStore.setSelectedQuickSearch({ assigneeId: checked ? AppState.userInfo.id : null });
    IssueStore.loadIssues();
  };

  onlyStory = (checked) => {
    IssueStore.setSelectedQuickSearch({ onlyStory: checked });
    IssueStore.loadIssues();
  };

  onChangeSelect = (checkedValues) => {
    IssueStore.setSelectedQuickSearch({ quickFilterIds: checkedValues });
    IssueStore.loadIssues();
  };

  render() {
    const {
      expand, selectedIssue, createIssueValue,
      selectIssueType, createLoading, create, checkCreateIssue,
      originPriorities,
    } = this.state;
    const columnFilter = new Map([
      ['issueNum', []],
      [
        'typeId', IssueStore.getIssueTypes.map(item => ({
          text: item.name,
          value: item.id,
        })),
      ],
      ['summary', []],
      [
        'statusId', IssueStore.getIssueStatus.map(item => ({
          text: item.name,
          value: item.id,
        })),
      ],
      [
        'priorityId', IssueStore.getIssuePriority.map(item => ({
          text: item.name,
          value: item.id,
        })),
      ],
      ['reporterName', []],
      ['assigneeName', []],
      ['sprint', []],
      ['component', []],
      ['epic', []],
    ]);
    const columns = [
      {
        title: '任务编号',
        dataIndex: 'issueNum',
        key: 'issueId',
        width: '128px',
        sorter: true,
        filters: columnFilter.get('issueNum'),
        render: this.renderIssueNum,
      },
      {
        title: '类型',
        dataIndex: 'issueTypeDTO.name',
        key: 'issueTypeId',
        width: '120px',
        sorter: true,
        filters: columnFilter.get('typeId'),
        filterMultiple: true,
        render: this.renderTypeCode,
      },
      {
        title: '概要',
        dataIndex: 'summary',
        key: 'summary',
        filters: columnFilter.get('summary'),
        render: this.renderSummary,
      },
      {
        title: '状态',
        dataIndex: 'statusMapDTO.name',
        key: 'statusId',
        width: '84px',
        sorter: true,
        filters: columnFilter.get('statusId'),
        filterMultiple: true,
        render: this.renderStatusName,
      },
      {
        title: '优先级',
        dataIndex: 'priorityDTO.name',
        key: 'priorityId',
        width: '96px',
        render: this.renderPriorityName,
        sorter: true,
        filters: columnFilter.get('priorityId'),
        filterMultiple: true,
      },
      {
        title: '报告人',
        dataIndex: 'reporterName',
        key: 'reporterId',
        width: '128px',
        sorter: true,
        filters: columnFilter.get('reporterName'),
        render: this.renderReporterName,
      },
      {
        title: '当前处理人',
        dataIndex: 'assigneeName',
        width: '128px',
        key: 'assigneeId',
        sorter: true,
        filters: columnFilter.get('assigneeName'),
        render: this.renderAssigneeName,
      },
      {
        title: '最后更新时间',
        dataIndex: 'lastUpdateDate',
        width: '138px',
        key: 'lastUpdateDate',
        sorter: true,
        render: this.renderLastUpdateTime,
      },
      {
        title: '版本',
        dataIndex: 'versionIssueRelDTOS',
        key: 'versionIssueRelDTOS',
        filters: columnFilter.get('versionIssueRelDTOS'),
        render: this.renderVersion,
      },
      {
        title: '冲刺',
        dataIndex: 'sprint',
        key: 'sprint',
        filters: columnFilter.get('sprint'),
        hidden: true,
      },
      {
        title: '模块',
        dataIndex: 'component',
        key: 'component',
        filters: columnFilter.get('component'),
        // filteredValue: {
        //   component: (IssueStore.getParamName ? IssueStore.getParamName : null),
        // },
        hidden: true,
      },
      {
        title: '史诗',
        dataIndex: 'epic',
        key: 'epic',
        filters: columnFilter.get('epic'),
        hidden: true,
      },
    ];

    const typeList = (
      <Menu
        style={{
          background: '#fff',
          boxShadow: '0 5px 5px -3px rgba(0, 0, 0, 0.20), 0 8px 10px 1px rgba(0, 0, 0, 0.14), 0 3px 14px 2px rgba(0, 0, 0, 0.12)',
          borderRadius: '2px',
        }}
        onClick={this.handleChangeType.bind(this)}
      >
        {
          ['story', 'task', 'bug', 'issue_epic'].map(type => (
            <Menu.Item key={type}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <TypeTag
                  data={type}
                  showName
                />
              </div>
            </Menu.Item>
          ))
        }
      </Menu>
    );

    return (
      <Page
        className="c7n-Issue"
        service={['agile-service.issue.deleteIssue', 'agile-service.issue.listIssueWithoutSub']}
      >
        <Header
          title="问题管理"
          backPath={IssueStore.getBackUrl}
        >
          <Button className="leftBtn" funcType="flat" onClick={() => this.setState({ create: true })}>
            <Icon type="playlist_add icon" />
            <span>创建问题</span>
          </Button>
          <Button className="leftBtn" funcType="flat" onClick={() => this.exportExcel()}>
            <Icon type="file_upload icon" />
            <span>导出</span>
          </Button>
          <Button
            funcType="flat"
            onClick={() => {
              const { current, pageSize } = IssueStore.pagination;
              IssueStore.loadIssues(current - 1, pageSize);
            }}
          >
            <Icon type="refresh icon" />
            <span>刷新</span>
          </Button>
        </Header>
        <Content style={{ display: 'flex', padding: '0', width: '100%' }}>
          <div
            className="c7n-content-issue"
            style={{
              width: expand ? '36%' : '100%',
              display: 'block',
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
          >
            <QuickSearch
              title={false}
              buttonName="自定义筛选"
              buttonIcon="more_vert"
              moreSelection={IssueStore.getQuickSearch}
              onChangeCheckBox={this.onChangeSelect}
              onlyStory={this.onlyStory}
              onlyMe={this.onlyMe}
            />
            <section
              className={`c7n-table ${expand ? 'expand-sign' : ''}`}
              style={{
                paddingRight: expand ? '0' : '24px',
                boxSizing: 'border-box',
                width: '100%',
              }}
            >
              <Table
                rowKey={record => record.issueId}
                columns={columns}
                components={
                  {
                    table: this.MyTable,
                    body: {
                      wrapper: this.BodyWrapper,
                      row: this.BodyRow,
                      cell: this.BodyCell,
                    },
                  }
                }
                size="large"
                dataSource={IssueStore.getIssues}
                filterBar
                showHeader={!expand}
                filterBarPlaceholder="过滤表"
                // filters={
                //   IssueStore.getParamName ? [IssueStore.getParamName] : []
                // }
                scroll={{ x: true }}
                loading={IssueStore.loading}
                pagination={false}
                onChange={this.handleFilterChange}
                rowClassName={(record, index) => (
                  record.issueId === selectedIssue && selectedIssue.issueId ? 'c7n-border-visible' : 'c7n-border'
                )}
                onRow={record => ({
                  onClick: () => {
                    this.setState({
                      selectedIssue: record,
                      expand: true,
                    });
                  },
                })
                }
              />
            </section>
            <div className="c7n-backlog-sprintIssue">
              <div
                style={{
                  userSelect: 'none',
                  background: 'white',
                  padding: '12px 0 12px 19px',
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  borderBottom: '1px solid #e8e8e8',
                }}
              >
                {checkCreateIssue ? (
                  <div className="c7n-add" style={{ display: 'block', width: '100%' }}>
                    <div style={{ display: 'flex' }}>
                      <Dropdown overlay={typeList} trigger={['click']}>
                        <div style={{ display: 'flex', alignItem: 'center' }}>
                          <div
                            className="c7n-sign"
                            style={{
                              backgroundColor: TYPE[selectIssueType],
                              marginRight: 2,
                            }}
                          >
                            <Icon
                              style={{ fontSize: '14px' }}
                              type={ICON[selectIssueType]}
                            />
                          </div>
                          <Icon
                            type="arrow_drop_down"
                            style={{ fontSize: 16 }}
                          />
                        </div>
                      </Dropdown>
                      <div style={{ marginLeft: 8, flexGrow: 1 }}>
                        <Input
                          autoFocus
                          value={createIssueValue}
                          placeholder="需要做什么？"
                          onChange={(e) => {
                            this.setState({
                              createIssueValue: e.target.value,
                            });
                          }}
                          maxLength={44}
                          onPressEnter={this.handleBlurCreateIssue.bind(this)}
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        marginTop: 10,
                        display: 'flex',
                        marginLeft: 32,
                        justifyContent: !expand ? 'flex-start' : 'flex-end',
                      }}
                    >
                      <Button
                        type="primary"
                        onClick={() => {
                          this.setState({
                            checkCreateIssue: false,
                          });
                        }}
                      >
                        {'取消'}
                      </Button>
                      <Button
                        type="primary"
                        loading={createLoading}
                        onClick={this.handleBlurCreateIssue.bind(this)}
                      >
                        {'确定'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    className="leftBtn"
                    style={{ color: '#3f51b5' }}
                    funcType="flat"
                    onClick={() => {
                      this.setState({
                        checkCreateIssue: true,
                        createIssueValue: '',
                      });
                    }}
                  >
                    <Icon type="playlist_add icon" />
                    <span>创建问题</span>
                  </Button>
                )}
              </div>
            </div>
            {
              IssueStore.getIssues.length !== 0 ? (
                <div style={{
                  display: 'flex', justifyContent: 'flex-end', marginTop: 16, marginBottom: 16,
                }}
                >
                  <Pagination
                    current={IssueStore.pagination.current}
                    defaultCurrent={1}
                    defaultPageSize={10}
                    pageSize={IssueStore.pagination.pageSize}
                    showSizeChanger
                    total={IssueStore.pagination.total}
                    onChange={this.handlePaginationChange.bind(this)}
                    onShowSizeChange={this.handlePaginationShowSizeChange.bind(this)}
                  />
                </div>
              ) : null
            }
          </div>

          <div
            className="c7n-sidebar"
            style={{
              width: expand ? '64%' : 0,
              display: expand ? 'block' : 'none',
              overflowY: 'hidden',
              overflowX: 'hidden',
            }}
          >
            {
            expand ? (
              <EditIssue
                store={IssueStore}
                issueId={selectedIssue && selectedIssue.issueId}
                onCancel={() => {
                  this.setState({
                    expand: false,
                    selectedIssue: {},
                    checkCreateIssue: false,
                  });
                }}
                onDeleteIssue={() => {
                  this.setState({
                    expand: false,
                    selectedIssue: {},
                  });
                  IssueStore.init();
                  IssueStore.loadIssues();
                }}
                onUpdate={this.handleIssueUpdate.bind(this)}
                onCopyAndTransformToSubIssue={() => {
                  const { current, pageSize } = IssueStore.pagination;
                  IssueStore.loadIssues(current - 1, pageSize);
                }}
              />
            ) : null
          }
          </div>
          {
          create ? (
            <CreateIssue
              visible={create}
              onCancel={() => this.setState({ create: false })}
              onOk={this.handleCreateIssue.bind(this)}

            />
          ) : null
        }
        </Content>
      </Page>
    );
  }
}

export default Issue;
