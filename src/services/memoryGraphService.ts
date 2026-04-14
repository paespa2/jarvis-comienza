import { db, auth } from '../firebase';
import { collection, doc, setDoc, getDoc, getDocs, query, where, deleteDoc, updateDoc } from 'firebase/firestore';

export interface KnowledgeNode {
  id?: string;
  uid: string;
  title: string;
  content: string;
  tags: string[];
  links: string[];
  updatedAt: number;
}

export const memoryGraphService = {
  async saveNode(title: string, content: string, tags: string[] = [], links: string[] = []) {
    if (!auth.currentUser) throw new Error("No user logged in");
    
    // Generar un ID basado en el título para evitar duplicados y facilitar la búsqueda
    const nodeId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const nodeRef = doc(db, `users/${auth.currentUser.uid}/knowledge_nodes`, nodeId);
    
    const nodeData: KnowledgeNode = {
      uid: auth.currentUser.uid,
      title,
      content,
      tags,
      links,
      updatedAt: Date.now()
    };

    await setDoc(nodeRef, nodeData, { merge: true });
    return nodeId;
  },

  async getNode(title: string): Promise<KnowledgeNode | null> {
    if (!auth.currentUser) return null;
    const nodeId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const nodeRef = doc(db, `users/${auth.currentUser.uid}/knowledge_nodes`, nodeId);
    const snap = await getDoc(nodeRef);
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as KnowledgeNode;
    }
    return null;
  },

  async getAllNodes(): Promise<KnowledgeNode[]> {
    if (!auth.currentUser) return [];
    const q = query(collection(db, `users/${auth.currentUser.uid}/knowledge_nodes`));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as KnowledgeNode));
  },

  async linkNodes(titleA: string, titleB: string) {
    if (!auth.currentUser) return;
    
    const nodeA = await this.getNode(titleA);
    const nodeB = await this.getNode(titleB);

    if (nodeA) {
      const links = new Set(nodeA.links || []);
      links.add(titleB);
      await this.saveNode(nodeA.title, nodeA.content, nodeA.tags, Array.from(links));
    }

    if (nodeB) {
      const links = new Set(nodeB.links || []);
      links.add(titleA);
      await this.saveNode(nodeB.title, nodeB.content, nodeB.tags, Array.from(links));
    }
  },

  async searchNodes(keyword: string): Promise<KnowledgeNode[]> {
    if (!auth.currentUser) return [];
    // Búsqueda simple (en un entorno real usaríamos Algolia o embeddings)
    const allNodes = await this.getAllNodes();
    const lowerKeyword = keyword.toLowerCase();
    
    return allNodes.filter(node => 
      node.title.toLowerCase().includes(lowerKeyword) || 
      node.content.toLowerCase().includes(lowerKeyword) ||
      node.tags.some(t => t.toLowerCase().includes(lowerKeyword))
    );
  }
};
