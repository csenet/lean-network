import React, { useState } from 'react';

interface DocumentationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const DocumentationPanel: React.FC<DocumentationPanelProps> = ({
  isOpen,
  onClose
}) => {
  const [activeSection, setActiveSection] = useState('overview');

  if (!isOpen) return null;

  const sections = [
    { id: 'overview', title: '概要', icon: '📋' },
    { id: 'devices', title: 'デバイス', icon: '🖥️' },
    { id: 'connections', title: '接続', icon: '🔗' },
    { id: 'l2l3', title: 'L2/L3セグメント', icon: '🌐' },
    { id: 'packets', title: 'パケット', icon: '📦' },
    { id: 'routing', title: 'ルーティング', icon: '🛤️' },
    { id: 'scenarios', title: '学習シナリオ', icon: '🎯' }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="doc-content">
            <h2>Packet Explorer とは</h2>
            <p>
              Packet Explorerは、高校生がネットワークの基本概念を視覚的に学習するためのシミュレーターです。
              特にL2（データリンク層）とL3（ネットワーク層）の違いと動作を理解することに焦点を当てています。
            </p>
            
            <h3>主な機能</h3>
            <ul>
              <li>ネットワークデバイス（クライアント、スイッチ、ルーター）の配置と設定</li>
              <li>デバイス間の物理的な接続の作成と管理</li>
              <li>L2/L3セグメントの視覚化</li>
              <li>パケット送信のシミュレーション</li>
              <li>ARPテーブルとルーティングテーブルの確認</li>
            </ul>

            <h3>学習目標</h3>
            <ul>
              <li>L2セグメント（スイッチングドメイン）の理解</li>
              <li>L3セグメント（ルーティングドメイン）の理解</li>
              <li>MACアドレスとIPアドレスの役割</li>
              <li>ARPの動作原理</li>
              <li>基本的なルーティングの仕組み</li>
            </ul>

            <div className="doc-note">
              <p><strong>💡 ヒント：</strong> 左のメニューから各トピックを選択して詳しい説明を読んでください。</p>
            </div>
          </div>
        );

      case 'devices':
        return (
          <div className="doc-content">
            <h2>ネットワークデバイス</h2>
            
            <div className="device-section">
              <h3>🖥️ クライアント</h3>
              <p>パソコンやサーバーなどのエンドデバイスです。</p>
              <ul>
                <li>IPアドレス、サブネットマスク、デフォルトゲートウェイを設定可能</li>
                <li>1つのネットワークポートを持つ</li>
                <li>ARPテーブルを持つ</li>
              </ul>
            </div>

            <div className="device-section">
              <h3>🔄 スイッチ</h3>
              <p>L2（データリンク層）で動作するネットワーク機器です。</p>
              <ul>
                <li>複数のポート（通常4つ）を持つ</li>
                <li>MACアドレステーブルを管理</li>
                <li>同じL2セグメント内のデバイス間を接続</li>
                <li>フラッディング、学習、転送の動作を行う</li>
              </ul>
            </div>

            <div className="device-section">
              <h3>🌐 ルーター</h3>
              <p>L3（ネットワーク層）で動作し、異なるネットワーク間を接続します。</p>
              <ul>
                <li>通常2つのポートを持つ</li>
                <li>ルーティングテーブルを管理</li>
                <li>異なるL3セグメント間でパケットを転送</li>
                <li>デフォルトゲートウェイとして機能</li>
              </ul>
            </div>

            <div className="doc-note">
              <p><strong>📝 演習：</strong> 各タイプのデバイスを追加して、それぞれの設定画面を確認してみましょう。</p>
            </div>
          </div>
        );

      case 'connections':
        return (
          <div className="doc-content">
            <h2>デバイス接続</h2>
            
            <h3>接続の作成方法</h3>
            <ol>
              <li>「接続モード開始」ボタンをクリック</li>
              <li>接続したい1つ目のデバイスをクリック</li>
              <li>接続したい2つ目のデバイスをクリック</li>
              <li>自動的に接続が作成されます</li>
            </ol>

            <h3>ポートについて</h3>
            <ul>
              <li><span className="port-indicator connected"></span> 緑色：接続済みポート</li>
              <li><span className="port-indicator available"></span> 黄色：利用可能ポート</li>
              <li>各デバイスには限られた数のポートがあります</li>
              <li>ポート情報はデバイス選択時に確認できます</li>
            </ul>

            <h3>接続の削除</h3>
            <ul>
              <li>接続線をクリックして選択</li>
              <li>コントロールパネルの「切断」ボタンをクリック</li>
            </ul>

            <div className="doc-note">
              <p><strong>📝 演習：</strong> クライアントをスイッチに接続し、スイッチ同士を接続してネットワークを構築してみましょう。</p>
            </div>
          </div>
        );

      case 'l2l3':
        return (
          <div className="doc-content">
            <h2>L2/L3セグメント</h2>
            
            <div className="segment-section">
              <h3>🔗 L2セグメント（データリンク層）</h3>
              <p>同じスイッチに接続されているデバイス群です。</p>
              <ul>
                <li>MACアドレスで通信</li>
                <li>同一ブロードキャストドメイン</li>
                <li>スイッチが自動的にMACアドレステーブルを構築</li>
                <li>物理的な接続によって決まる</li>
              </ul>
            </div>

            <div className="segment-section">
              <h3>🌐 L3セグメント（ネットワーク層）</h3>
              <p>同じIPネットワークに属するデバイス群です。</p>
              <ul>
                <li>IPアドレスで通信</li>
                <li>サブネットマスクで範囲を定義</li>
                <li>異なるL3セグメント間はルーターが必要</li>
                <li>論理的な設定によって決まる</li>
              </ul>
            </div>

            <h3>セグメントの視覚化</h3>
            <ul>
              <li>L2セグメント：点線で表示</li>
              <li>L3セグメント：色付きの領域で表示</li>
              <li>デバイスのIPアドレス設定に基づいて自動的にグループ化</li>
            </ul>

            <div className="doc-note">
              <p><strong>💡 重要：</strong> L2セグメントは物理接続、L3セグメントは論理設定によって決まることを理解しましょう。</p>
            </div>
          </div>
        );

      case 'packets':
        return (
          <div className="doc-content">
            <h2>パケットシミュレーション</h2>
            
            <h3>パケットの種類</h3>
            <div className="packet-types">
              <div className="packet-type">
                <span className="packet-icon icmp">I</span>
                <div>
                  <strong>ICMP（Ping）</strong>
                  <p>接続性テストに使用されるパケット</p>
                </div>
              </div>
              <div className="packet-type">
                <span className="packet-icon arp">A</span>
                <div>
                  <strong>ARP</strong>
                  <p>IPアドレスからMACアドレスを解決</p>
                </div>
              </div>
              <div className="packet-type">
                <span className="packet-icon data">D</span>
                <div>
                  <strong>データ</strong>
                  <p>一般的なデータ通信パケット</p>
                </div>
              </div>
            </div>

            <h3>パケット送信の流れ</h3>
            <ol>
              <li>送信元デバイスを選択</li>
              <li>宛先デバイスを選択</li>
              <li>パケットタイプを選択</li>
              <li>「パケット送信」ボタンをクリック</li>
              <li>パケットの移動をアニメーションで確認</li>
            </ol>

            <div className="doc-note">
              <p><strong>📝 演習：</strong> 異なるセグメントのデバイス間でパケットを送信し、ルーティングの動作を観察してみましょう。</p>
            </div>
          </div>
        );

      case 'routing':
        return (
          <div className="doc-content">
            <h2>ルーティング</h2>
            
            <h3>ルーティングテーブル</h3>
            <p>ルーターが持つ、どのネットワークへどのパスで送信するかの情報です。</p>
            
            <h4>ルーティングエントリの追加方法</h4>
            <ol>
              <li>ルーターを選択して「編集」をクリック</li>
              <li>ルーティングテーブルセクションで「ルート追加」</li>
              <li>必要な情報を入力：
                <ul>
                  <li><strong>ネットワーク：</strong> 宛先ネットワークアドレス</li>
                  <li><strong>マスク：</strong> サブネットマスク</li>
                  <li><strong>ゲートウェイ：</strong> 次のホップのIPアドレス</li>
                  <li><strong>インターフェース：</strong> 使用するポート</li>
                </ul>
              </li>
            </ol>

            <h3>ルーティングの動作</h3>
            <ol>
              <li>パケットの宛先IPアドレスを確認</li>
              <li>ルーティングテーブルから最適なルートを検索</li>
              <li>指定されたゲートウェイに転送</li>
              <li>宛先に到達するまで繰り返し</li>
            </ol>

            <div className="doc-note">
              <p><strong>⚠️ 注意：</strong> ルーティングテーブルが正しく設定されていないと、パケットは宛先に到達できません。</p>
            </div>
          </div>
        );

      case 'scenarios':
        return (
          <div className="doc-content">
            <h2>学習シナリオ</h2>
            
            <div className="scenario">
              <h3>シナリオ1：基本的なL2ネットワーク</h3>
              <p><strong>目標：</strong> L2セグメントの動作を理解する</p>
              <ol>
                <li>スイッチを1つ追加</li>
                <li>クライアントを2つ追加し、同じIPネットワーク（例：192.168.1.0/24）に設定</li>
                <li>クライアントをスイッチに接続</li>
                <li>ARPパケットを送信してMACアドレス学習を観察</li>
                <li>PingパケットでL2通信を確認</li>
              </ol>
            </div>

            <div className="scenario">
              <h3>シナリオ2：L3セグメント間通信</h3>
              <p><strong>目標：</strong> ルーティングの基本を理解する</p>
              <ol>
                <li>2つのスイッチと1つのルーターを配置</li>
                <li>各スイッチに異なるネットワークのクライアントを接続</li>
                <li>ルーターの各ポートに異なるIPアドレスを設定</li>
                <li>クライアントのデフォルトゲートウェイをルーターに設定</li>
                <li>ルーティングテーブルを設定</li>
                <li>異なるセグメント間でパケット送信</li>
              </ol>
            </div>

            <div className="scenario">
              <h3>シナリオ3：複雑なネットワーク</h3>
              <p><strong>目標：</strong> 実際的なネットワーク構成を学習する</p>
              <ol>
                <li>複数のスイッチとルーターで階層ネットワークを構築</li>
                <li>各セグメントに適切なIPアドレス体系を設計</li>
                <li>ルーティングテーブルを設定</li>
                <li>様々な経路でのパケット転送を確認</li>
                <li>ネットワーク障害時の動作をシミュレーション</li>
              </ol>
            </div>

            <div className="doc-note">
              <p><strong>🎯 推奨順序：</strong> シナリオ1→2→3の順番で学習することを推奨します。</p>
            </div>
          </div>
        );

      default:
        return <div>選択されたセクションが見つかりません。</div>;
    }
  };

  return (
    <div className="documentation-overlay">
      <div className="documentation-panel">
        <div className="doc-header">
          <h1>📚 Packet Explorer ドキュメント</h1>
          <button onClick={onClose} className="close-button">✕</button>
        </div>
        
        <div className="doc-body">
          <div className="doc-sidebar">
            <nav className="doc-nav">
              {sections.map(section => (
                <button
                  key={section.id}
                  className={`nav-item ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <span className="nav-icon">{section.icon}</span>
                  {section.title}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="doc-main">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationPanel;