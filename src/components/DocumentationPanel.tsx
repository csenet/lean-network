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
    { id: 'exercises', title: '実習・演習', icon: '🎯' }
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

      case 'exercises':
        return (
          <div className="doc-content">
            <h2>📚 実習・演習</h2>
            <p>プリセット構成を使用した実践的な学習カリキュラムです。</p>

            <div className="scenario">
              <h3>🎯 演習1：PC直接接続</h3>
              <p><strong>プリセット：</strong> 「PC直接接続」ボタンを使用</p>
              <p><strong>学習目標：</strong> L2直接通信の基本を理解する</p>

              <h4>📋 構成内容</h4>
              <ul>
                <li>PC1 (192.168.1.10/24) ↔ PC2 (192.168.1.20/24)</li>
                <li>直接ケーブル接続（クロスケーブル相当）</li>
                <li>同一L2セグメント内での通信</li>
              </ul>

              <h4>🔬 実習内容</h4>
              <ol>
                <li>プリセットをロードして構成を確認</li>
                <li>各PCのネットワーク設定を確認（IP、サブネット）</li>
                <li>ARPパケットを送信してARPテーブルの更新を観察</li>
                <li>ICMPパケット（Ping）で接続性をテスト</li>
                <li>各PCのARPテーブルを確認してMACアドレス学習を検証</li>
              </ol>

              <h4>📖 学習ポイント</h4>
              <ul>
                <li>ARP（Address Resolution Protocol）の動作原理</li>
                <li>L2でのMACアドレスベース通信</li>
                <li>同一セグメント内での直接通信</li>
              </ul>
            </div>

            <div className="scenario">
              <h3>🎯 演習2：PC-スイッチ-PC構成</h3>
              <p><strong>プリセット：</strong> 「PC-スイッチ-PC」ボタンを使用</p>
              <p><strong>学習目標：</strong> L2スイッチの動作を理解する</p>

              <h4>📋 構成内容</h4>
              <ul>
                <li>PC1 (192.168.1.10/24) → Switch1 → PC2 (192.168.1.20/24)</li>
                <li>L2スイッチ経由の通信</li>
                <li>スイッチのMACアドレステーブル学習</li>
              </ul>

              <h4>🔬 実習内容</h4>
              <ol>
                <li>プリセットをロードして構成を確認</li>
                <li>スイッチのMACアドレステーブルが空であることを確認</li>
                <li>PC1からPC2にARPパケットを送信</li>
                <li>スイッチがMACアドレスを学習する過程を観察</li>
                <li>スイッチのMACテーブルに両PCのMACアドレスが記録されることを確認</li>
                <li>ICMPパケットでの通信を観察</li>
                <li>スイッチがフラッディング→学習→転送の動作を行うことを理解</li>
              </ol>

              <h4>📖 学習ポイント</h4>
              <ul>
                <li>L2スイッチのフラッディング、学習、転送動作</li>
                <li>MACアドレステーブルの構築過程</li>
                <li>ブロードキャストドメインの概念</li>
              </ul>
            </div>

            <div className="scenario">
              <h3>🎯 演習3：ルーター付きネットワーク</h3>
              <p><strong>プリセット：</strong> 「ルーター付きネットワーク」ボタンを使用</p>
              <p><strong>学習目標：</strong> L3ルーティングとセグメント間通信を理解する</p>

              <h4>📋 構成内容</h4>
              <ul>
                <li>セグメント1: PC1 (192.168.1.10/24) → Switch1 → Router1 (192.168.1.1/24)</li>
                <li>セグメント2: Router1 (192.168.2.1/24) → Switch2 → PC2 (192.168.2.10/24)</li>
                <li>異なるL3セグメント間の通信</li>
                <li>ルーターによるL3転送</li>
              </ul>

              <h4>🔬 実習内容</h4>
              <ol>
                <li>プリセットをロードして全体構成を確認</li>
                <li>L2セグメント（スイッチドメイン）とL3セグメント（IPネットワーク）の違いを確認</li>
                <li>各デバイスのルーティングテーブル／ARPテーブルを確認</li>
                <li>PC1からPC2へICMPパケットを送信</li>
                <li>パケットがルーターを経由する経路を観察</li>
                <li>ルーターでのMACアドレス書き換えを確認</li>
                <li>各セグメントでのARP処理を観察</li>
                <li>戻りパケットの経路も確認</li>
              </ol>

              <h4>📖 学習ポイント</h4>
              <ul>
                <li>L2とL3の境界でのパケット処理</li>
                <li>ルーターによるMACアドレス書き換え</li>
                <li>デフォルトゲートウェイの役割</li>
                <li>ルーティングテーブルの参照</li>
                <li>ARP境界（ルーターでARPが止まること）</li>
              </ul>
            </div>

            <div className="doc-note">
              <p><strong>🎯 学習の進め方：</strong></p>
              <ol>
                <li>各演習は順番に実施することを推奨</li>
                <li>プリセット構成をロード後、必ず各デバイスの設定を確認</li>
                <li>パケット送信前後でテーブル（ARP／MAC／ルーティング）の変化を観察</li>
                <li>パケットの移動経路とプロトコルの動作を関連付けて理解</li>
              </ol>
            </div>

            <div className="doc-note">
              <p><strong>💡 応用課題：</strong></p>
              <ul>
                <li>プリセット構成を変更して異なるIPアドレス体系を試す</li>
                <li>ルーティングテーブルに静的ルートを追加する</li>
                <li>意図的に設定ミスを作り、通信できない状況を作って原因を調査する</li>
              </ul>
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