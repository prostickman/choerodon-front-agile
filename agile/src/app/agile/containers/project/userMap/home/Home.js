import React, { Component } from 'react';
import { observer, inject } from 'mobx-react';
import _ from 'lodash';
import { Page, Header, Content, stores, axios } from 'choerodon-front-boot';
import { Table, Button, Select, Popover, Tabs, Tooltip, Input, Dropdown, Menu, Pagination, Spin, Icon, Card, Checkbox } from 'choerodon-ui';
import './Home.scss';
import CreateEpic from '../component/CreateEpic';
import Backlog from '../component/Backlog/Backlog.js';
import IssueCard from '../component/IssueCard/IssueCard.js';
import EpicCard from '../component/EpicCard/EpicCard.js';
import CreateIssue from '../component/CreateIssue/CreateIssue.js';


const Option = Select.Option;
const TabPane = Tabs.TabPane;
const { AppState } = stores;

@observer
class Home extends Component {
  constructor(props) {
    super(props);
    this.state = {
      moreMenuShow: false,
      scrollPosition: 'fixed',
    };
  }
  componentDidMount() {
    this.initData();
    // window.addEventListener('scroll', this.handleScroll, true);
    // window.onscroll = this.handleScroll;
  }
  initData =() => {
    this.props.UserMapStore.initData();
  };

  addFilter = () => {

  };
  handleScroll = (e) => {
    const position = this.state.scrollPosition;
    const ele = document.getElementById('map-content');
    if (ele.scrollLeft !== 0 && position !== 'absolute') {
      this.setState({ scrollPosition: 'absolute' });
      window.console.log('左右');
    }
    if (ele.scrollTop !== 0 && position !== 'fixed') {
      this.setState({ scrollPosition: 'fixed' });
      window.console.log('上下');
    }
  };
  changeMode =(options) => {
    this.props.UserMapStore.setMode(options.key);
    this.props.UserMapStore.loadIssues(options.key, 'usermap');
  };
  handleCreateEpic = () => {
    this.props.UserMapStore.setCreateEpic(true);
  };

  addFilter =(e) => {
    const { currentFilters } = this.props.UserMapStore;
    const arr = _.cloneDeep(currentFilters);
    const value = e._dispatchInstances.key;
    if (currentFilters.includes(value)) {
      const index = arr.indexOf(value);
      arr.splice(index, 1);
    } else {
      arr.push(value);
    }
    this.props.UserMapStore.setCurrentFilter(arr);
  };

  changeMenuShow =(options) => {
    const { moreMenuShow } = this.state;
    this.setState({ moreMenuShow: !moreMenuShow });
  };

  filterIssue =(e) => {
    e.stopPropagation();
  };
  renderHeight() {
    if (document.getElementsByClassName('swimlane-column').length > 0) {
      return `calc(100vh - ${parseInt(document.getElementsByClassName('swimlane-column')[0].offsetTop, 10) + 48}px)`;
    }
    return '';
  }

  renderSprintSwimlane = () => {
    const { UserMapStore } = this.props;
    const epicData = UserMapStore.getEpics;
    const { filters, mode, issues, createEpic, currentFilters } = UserMapStore;
  };

  renderVersionSwimlane = () => {
    const { UserMapStore } = this.props;
    const epicData = UserMapStore.getEpics;
    const { filters, mode, issues, createEpic, currentFilters } = UserMapStore;
  };
  render() {
    const { UserMapStore } = this.props;
    const epicData = UserMapStore.getEpics;
    const { filters, mode, issues, createEpic, currentFilters } = UserMapStore;
    const swimlanMenu = (
      <Menu onClick={this.changeMode} selectable>
        <Menu.Item key="none">无泳道</Menu.Item>
        <Menu.Item key="version">版本泳道</Menu.Item>
        <Menu.Item key="sprint">冲刺泳道</Menu.Item>
      </Menu>
    );
    return (
      <Page
        className="c7n-map"
        service={['agile-service.issue.deleteIssue', 'agile-service.issue.listIssueWithoutSub']}
      >
        <Header title="用户故事地图">
          <Dropdown overlay={swimlanMenu} trigger={['click']}>
            <Button>
              {mode === 'no' && '无泳道'}
              {mode === 'version' && '版本泳道'}
              {mode === 'sprint' && '冲刺泳道'}
              <Icon type="arrow_drop_down" />
            </Button>
          </Dropdown>
          <Button onClick={this.changeMenuShow}>
            更多 <Icon type="arrow_drop_down" />
          </Button>
          <div style={{ display: this.state.moreMenuShow ? 'block' : 'none', padding: '20px 14px' }} className="moreMenu">
            <div className="menu-title">史诗过滤器</div>
            <div style={{ height: 22, marginBottom: 10 }}>
              <Checkbox>已完成的史诗</Checkbox>
            </div>
            <div style={{ height: 22 }} >
              <Checkbox>应用快速搜索到史诗</Checkbox>
            </div>
            <div className="menu-title">导出</div>
            <div style={{ height: 22, marginBottom: 10 }}>导出为excel</div>
            <div style={{ height: 22, marginBottom: 10 }}>导出为图片</div>
          </div>
          <Button className="leftBtn" functyp="flat" onClick={this.handleCreateEpic}>
            <Icon type="playlist_add" />创建史诗
          </Button>
        </Header>
        <div className="c7n-userMap" onScroll={this.handleScroll} id="map-content">
          <section className="c7n-usermap-quickFilter">
            <div className="filter">
              <p>快速搜索:</p>
              <p role="none" style={{ background: `${currentFilters.includes('onlyMe') ? 'rgb(63, 81, 181)' : 'white'}`, color: `${currentFilters.includes('onlyMe') ? 'white' : '#3F51B5'}` }} onClick={this.addFilter} key={'onlyMe'}>仅我的问题</p>
              <p role="none" style={{ background: `${currentFilters.includes('onlyStory') ? 'rgb(63, 81, 181)' : 'white'}`, color: `${currentFilters.includes('onlyStory') ? 'white' : '#3F51B5'}` }} onClick={this.addFilter} key={'onlyStory'}>仅用户故事</p>
              {filters.map(filter => <p role="none" style={{ background: `${currentFilters.includes(filter.filterId.toString()) ? 'rgb(63, 81, 181)' : 'white'}`, color: `${currentFilters.includes(filter.filterId.toString()) ? 'white' : '#3F51B5'}` }} onClick={this.addFilter} key={filter.filterId}>{filter.name}</p>) }
            </div>
          </section>
          <section className="epic">
            {epicData.map(epic => (<div className="epic-card">
              {epic.issueId}
            </div>))}
          </section>
          {mode === 'sprint' && this.renderSprintSwimlane()}
          {mode === 'version' && this.renderVersionSwimlane()}
          {mode === 'none' && (
            <React.Fragment>
              <div className="swimlane-title">
                <div style={{ position: 'fixed', background: 'rgba(0,0,0,0.02)', height: 42, width: '100%' }}>
                  <span style={{ position: 'fixed', left: 274 }}>issue</span>
                  <div style={{ position: 'fixed', right: 10, display: 'flex', marginTop: 10 }}>
                    <p className="point-span" style={{ background: '#4D90FE' }}>
                      {_.reduce(issues, (sum, issue) => {
                        if (issue.statusCode === 'todo') {
                          return sum + issue.storyPoints;
                        } else {
                          return sum;
                        }
                      }, 0)}
                    </p>
                    <p className="point-span" style={{ background: '#FFB100' }}>
                      {_.reduce(issues, (sum, issue) => {
                        if (issue.statusCode === 'doing') {
                          return sum + issue.storyPoints;
                        } else {
                          return sum;
                        }
                      }, 0)}
                    </p>
                    <p className="point-span" style={{ background: '#00BFA5' }}>
                      {_.reduce(issues, (sum, issue) => {
                        if (issue.statusCode === 'done') {
                          return sum + issue.storyPoints;
                        } else {
                          return sum;
                        }
                      }, 0)}
                    </p>
                    <p>
                      <Icon type="baseline-arrow_drop_down" />
                    </p>

                  </div>
                </div>
              </div>
              <section id={'swimlane-column'} style={{ height: this.renderHeight(), overflow: 'scroll', width: `${epicData.length * 220 + epicData.length * 10 - 20}px` }}>
                <div style={{ display: 'flex' }}>
                  {epicData.map((epic, index) => (<div className="swimlane-column">
                    <React.Fragment>
                      {_.filter(issues, issue => issue.epicId === epic.issueId).map(item => (
                        <div className="issue-card">{item.epicId}</div>
                      ))}
                    </React.Fragment>
                  </div>))}
                </div>
              </section>
            </React.Fragment>)}
        </div>
        <Backlog />
        <CreateEpic visible={createEpic} />
        <IssueCard />
        <EpicCard />
        <CreateIssue />
      </Page>
    );
  }
}
export default Home;
